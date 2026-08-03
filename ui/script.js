const { listen } = window.__TAURI__.event;
const { invoke } = window.__TAURI__.core;

const overlayRoot = document.getElementById('overlay-root');
const activeBubbles = new Set();
const MAX_BUBBLES = 6;
const MAX_LIFETIME_MS = 12000;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

const bubbleSizer = document.createElement('div');
bubbleSizer.style.position = 'absolute';
bubbleSizer.style.visibility = 'hidden';
bubbleSizer.style.pointerEvents = 'none';
bubbleSizer.style.whiteSpace = 'pre-wrap';
bubbleSizer.style.wordWrap = 'break-word';
bubbleSizer.style.overflowWrap = 'break-word';
bubbleSizer.style.padding = '24px 22px';
bubbleSizer.style.font = '14px "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
bubbleSizer.style.lineHeight = '1.6';
bubbleSizer.style.boxSizing = 'border-box';
bubbleSizer.style.maxWidth = '720px';
bubbleSizer.style.minWidth = '320px';
overlayRoot.appendChild(bubbleSizer);

function measureExpandedText(text) {
    const maxWidth = Math.min(window.innerWidth * 0.84, 720);
    const minWidth = 320;
    bubbleSizer.style.width = 'auto';
    bubbleSizer.style.maxWidth = `${maxWidth}px`;
    bubbleSizer.textContent = text;

    const measuredWidth = Math.min(maxWidth, Math.max(minWidth, bubbleSizer.scrollWidth));
    bubbleSizer.style.width = `${measuredWidth}px`;

    const measuredHeight = bubbleSizer.scrollHeight;
    const maxHeight = Math.min(window.innerHeight * 0.72, 560);
    return {
        width: measuredWidth,
        height: Math.min(measuredHeight, maxHeight),
        needsScroll: measuredHeight > maxHeight,
        maxHeight,
    };
}

// Track mouse position for bubble spawning - from Rust backend
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Listen for mouse position from Rust backend
listen('mouse-position', (event) => {
    const [mx, my] = event.payload;
    // Since window is fullscreen, use global coordinates directly
    mouseX = mx;
    mouseY = my;
});

function normalizeText(text) {
    return (text ?? '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

function shortLabel(text) {
    const normalized = normalizeText(text);
    return normalized.length > 18 ? `${normalized.slice(0, 16)}…` : normalized;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function expandBubble(entry) {
    entry.hovered = true;

    const expanded = measureExpandedText(entry.text);
    const bottomMargin = 22;
    const expandedLeft = clamp(entry.x, 16, Math.max(window.innerWidth - expanded.width - 16, 16));
    const expandedTop = Math.max(16, window.innerHeight - expanded.height - bottomMargin);

    entry.renderX = expandedLeft;
    entry.renderY = expandedTop;
    entry.renderWidth = expanded.width;
    entry.renderHeight = expanded.height;

    entry.node.classList.add('expanded');
    entry.node.style.width = `${expanded.width}px`;
    entry.node.style.height = `${expanded.height}px`;
    entry.node.style.left = `${expandedLeft}px`;
    entry.node.style.top = `${expandedTop}px`;
    entry.node.style.padding = '24px 22px';
    entry.node.style.overflowY = expanded.needsScroll ? 'auto' : 'hidden';
    entry.node.style.overflowX = 'hidden';
    entry.node.textContent = entry.text;
}

function collapseBubble(entry) {
    entry.hovered = false;
    entry.renderX = entry.x;
    entry.renderY = entry.y;
    entry.renderWidth = entry.width;
    entry.renderHeight = entry.height;

    entry.node.classList.remove('expanded');
    entry.node.style.width = `${entry.width}px`;
    entry.node.style.height = `${entry.height}px`;
    entry.node.style.left = `${entry.x}px`;
    entry.node.style.top = `${entry.y}px`;
    entry.node.style.borderRadius = '20px';
    entry.node.style.padding = '8px 16px';
    entry.node.style.overflowY = 'hidden';
    entry.node.style.overflowX = 'hidden';
    entry.node.textContent = entry.shortText;
}

function syncBubbleHoverState() {
    for (const entry of activeBubbles) {
        const hoveredElement = document.elementFromPoint(pointerX, pointerY);
        const pointerInside = !!hoveredElement && (entry.node === hoveredElement || entry.node.contains(hoveredElement));

        if (pointerInside && !entry.hovered) {
            entry.vx = 0;
            entry.vy = 0;
            expandBubble(entry);
        } else if (!pointerInside && entry.hovered) {
            collapseBubble(entry);
        }
    }
}

// Helper to push all active bounding rect values into Rust engine cache
function syncBubblesToBackend() {
    const bubblePayload = Array.from(activeBubbles).map(b => {
        const rectX = b.hovered ? b.renderX : b.x;
        const rectY = b.hovered ? b.renderY : b.y;
        const rectWidth = b.hovered ? b.renderWidth : b.width;
        const rectHeight = b.hovered ? b.renderHeight : b.height;

        return {
            id: b.id,
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight
        };
    });
    void invoke('update_rust_bubbles', { bubbles: bubblePayload });
}

function removeBubble(entry) {
    if (!activeBubbles.has(entry)) return;
    entry.node.classList.add('is-exiting');
    window.setTimeout(() => {
        entry.node.remove();
        activeBubbles.delete(entry);
        syncBubblesToBackend();
    }, 260);
}

function createBubble(text, spawnX, spawnY) {
    const dropSize = 12;
    
    console.log('Creating bubble with spawn position:', spawnX, spawnY);
    console.log('Drop will be created at:', spawnX - dropSize / 2, spawnY - dropSize / 2);
    
    // Calculate initial capsule size based on short label (title text only)
    const shortLabelText = shortLabel(text);
    const initialWidth = Math.max(80, Math.min(shortLabelText.length * 8 + 32, 200));
    const initialHeight = 36; // Fixed height for capsule
    
    // Create water drop at cursor position
    const drop = document.createElement('div');
    drop.className = 'water-drop';
    drop.style.width = `${dropSize}px`;
    drop.style.height = `${dropSize}px`;
    drop.style.left = `${spawnX - dropSize / 2}px`;
    drop.style.top = `${spawnY - dropSize / 2}px`;
    drop.style.position = 'absolute';
    drop.style.borderRadius = '50%';
    drop.style.background = 'radial-gradient(circle at 30% 30%, rgba(92, 244, 158, 0.9), rgba(31, 94, 64, 0.7))';
    drop.style.boxShadow = '0 4px 12px rgba(20, 120, 74, 0.4)';
    drop.style.transition = 'top 0.3s ease-in';
    drop.style.zIndex = '1000';
    drop.style.opacity = '1';
    
    overlayRoot.appendChild(drop);
    
    console.log('Drop element created and appended to DOM');
    console.log('Drop initial position - left:', drop.style.left, 'top:', drop.style.top);
    
    // Animate drop falling to bottom immediately
    const bottomY = window.innerHeight - initialHeight - 20;
    console.log('Dropping from', spawnY, 'to', bottomY);
    
    // Small delay to ensure drop is visible at starting position before animation
    setTimeout(() => {
        drop.style.top = `${bottomY}px`;
        console.log('Drop animation started, new top:', bottomY);
    }, 50);
    
    // After drop reaches bottom, create the actual bubble
    setTimeout(() => {
        console.log('Drop reached bottom, creating bubble');
        drop.remove();
        
        // Mark all existing bubbles as not newest
        activeBubbles.forEach(b => b.isNewest = false);

        const entry = {
            id: Math.random().toString(36).substring(2, 9),
            node: document.createElement('div'),
            text: normalizeText(text),
            shortText: shortLabelText,
            x: spawnX - initialWidth / 2,
            y: window.innerHeight - initialHeight - 20,
            vx: (Math.random() - 0.5) * 2,
            vy: 0,
            width: initialWidth,
            height: initialHeight,
            size: Math.max(initialWidth, initialHeight),
            life: 0,
            maxLife: MAX_LIFETIME_MS,
            hovered: false,
            phase: Math.random() * Math.PI * 2,
            isNewest: true,
            renderX: spawnX - initialWidth / 2,
            renderY: window.innerHeight - initialHeight - 20,
            renderWidth: initialWidth,
            renderHeight: initialHeight,
        };

        entry.node.className = 'bubble spawn';
        entry.node.style.width = `${initialWidth}px`;
        entry.node.style.height = `${initialHeight}px`;
        entry.node.style.left = `${entry.x}px`;
        entry.node.style.top = `${entry.y}px`;
        entry.node.textContent = shortLabelText;
        entry.node.title = entry.text;

        // Click handler to copy text to clipboard
        entry.node.addEventListener('click', async (event) => {
            event.stopPropagation();
            await invoke('copy_to_clipboard', { text: entry.text });
            removeBubble(entry);
        });

        overlayRoot.appendChild(entry.node);
        activeBubbles.add(entry);
        syncBubblesToBackend();

        window.setTimeout(() => {
            if (activeBubbles.has(entry)) removeBubble(entry);
        }, MAX_LIFETIME_MS);

        return entry;
    }, 300); // Wait for drop animation to complete (matches transition duration)
}

function applyBubbleStyle(entry) {
    const ageRatio = entry.life / entry.maxLife;
    const nearDeath = ageRatio >= 0.8;

    if (nearDeath) {
        // About to expire: red (keep as is)
        entry.node.style.background = 'linear-gradient(180deg, rgba(228, 92, 92, 0.74), rgba(106, 32, 32, 0.46))';
        entry.node.style.borderColor = 'rgba(255, 188, 180, 0.48)';
        entry.node.style.boxShadow = '0 14px 30px rgba(130, 28, 24, 0.26), inset 0 1px 1px rgba(255, 255, 255, 0.16)';
    } else if (entry.isNewest) {
        // Newest bubble: green
        entry.node.style.background = 'linear-gradient(180deg, rgba(92, 244, 158, 0.72), rgba(31, 94, 64, 0.34))';
        entry.node.style.borderColor = 'rgba(168, 255, 213, 0.42)';
        entry.node.style.boxShadow = '0 14px 30px rgba(20, 120, 74, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.16)';
    } else {
        // Other bubbles: yellow
        entry.node.style.background = 'linear-gradient(180deg, rgba(251, 191, 36, 0.72), rgba(120, 53, 15, 0.34))';
        entry.node.style.borderColor = 'rgba(254, 243, 199, 0.42)';
        entry.node.style.boxShadow = '0 14px 30px rgba(120, 53, 15, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.16)';
    }
}

function animate() {
    syncBubbleHoverState();

    const entries = [...activeBubbles];

    for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
            const a = entries[i];
            const b = entries[j];

            // Use actual bounding boxes for collision detection
            const aLeft = a.x;
            const aRight = a.x + a.width;
            const aTop = a.y;
            const aBottom = a.y + a.height;
            
            const bLeft = b.x;
            const bRight = b.x + b.width;
            const bTop = b.y;
            const bBottom = b.y + b.height;
            
            // Check if rectangles overlap
            const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
            const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);
            
            if (overlapX > 0 && overlapY > 0) {
                const aCenterX = a.x + a.width / 2;
                const aCenterY = a.y + a.height / 2;
                const bCenterX = b.x + b.width / 2;
                const bCenterY = b.y + b.height / 2;

                const dx = bCenterX - aCenterX;
                const dy = bCenterY - aCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = dx / dist;
                const ny = dy / dist;
                const separation = Math.min(overlapX, overlapY) / 2;

                if (a.hovered && b.hovered) {
                    continue;
                }

                if (a.hovered || b.hovered) {
                    const staticBubble = a.hovered ? a : b;
                    const movingBubble = a.hovered ? b : a;

                    movingBubble.x += (movingBubble === b ? nx : -nx) * separation;
                    movingBubble.y += (movingBubble === b ? ny : -ny) * separation;
                    movingBubble.vx += (movingBubble === b ? nx : -nx) * 0.2;
                    movingBubble.vy += (movingBubble === b ? ny : -ny) * 0.2;
                    continue;
                }

                a.x -= nx * separation;
                a.y -= ny * separation;
                b.x += nx * separation;
                b.y += ny * separation;

                const relVx = b.vx - a.vx;
                const relVy = b.vy - a.vy;
                const velAlongNormal = relVx * nx + relVy * ny;

                if (velAlongNormal < 0) {
                    const restitution = 0.6;
                    const impulse = (-(1 + restitution) * velAlongNormal) / 2;
                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;
                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                }
            }
        }
    }

    for (const entry of entries) {
        entry.life += 16;

        if (!entry.hovered) {
            // Apply gravity
            entry.vy += 0.15; // Gravity acceleration
            
            entry.x += entry.vx;
            entry.y += entry.vy;

            const maxX = Math.max(window.innerWidth - entry.width, 0);
            const maxY = Math.max(window.innerHeight - entry.height, 0);

            // Bounce off bottom with energy loss
            if (entry.y > maxY) {
                entry.y = maxY;
                entry.vy = -Math.abs(entry.vy) * 0.6; // More damping on bottom bounce
                // Add gentle horizontal movement when at bottom
                if (Math.abs(entry.vx) < 0.5) {
                    entry.vx = (Math.random() - 0.5) * 1.5; // Random horizontal drift
                }
            }

            // Bounce off walls (horizontal only)
            if (entry.x < 0) {
                entry.x = 0;
                entry.vx = Math.abs(entry.vx) * 0.8;
            }

            if (entry.x > maxX) {
                entry.x = maxX;
                entry.vx = -Math.abs(entry.vx) * 0.8;
            }
            
            // Add gentle horizontal drift when near bottom
            if (entry.y > window.innerHeight * 0.85) {
                entry.vx += (Math.random() - 0.5) * 0.1; // Small random horizontal push
            }
            
            // Clamp velocity - restrict vertical movement more
            entry.vx = clamp(entry.vx, -3, 3);
            entry.vy = clamp(entry.vy, -2, 5); // Allow downward but limit upward
        }

        entry.x = clamp(entry.x, 0, Math.max(window.innerWidth - entry.width, 0));
        entry.y = clamp(entry.y, 0, Math.max(window.innerHeight - entry.height, 0));

        if (!entry.hovered) {
            entry.renderX = entry.x;
            entry.renderY = entry.y;
            entry.renderWidth = entry.width;
            entry.renderHeight = entry.height;
            entry.node.style.left = `${entry.x}px`;
            entry.node.style.top = `${entry.y}px`;
        }

        applyBubbleStyle(entry);
    }

    // CRITICAL: Push new coordinates into Rust loop cache so tracking stays aligned
    if (entries.length > 0) {
        syncBubblesToBackend();
    }

    window.requestAnimationFrame(animate);
}

listen('clip-spawn', (event) => {
    const payload = event.payload;
    const text = normalizeText(payload[0] ?? '');
    const copyX = payload[1];
    const copyY = payload[2];
    
    console.log('Clip-spawn received:', text, 'at screen position:', copyX, copyY);
    console.log('Window position:', window.screenX, window.screenY);
    console.log('Window size:', window.innerWidth, window.innerHeight);
    
    if (!text) return;

    if (activeBubbles.size >= MAX_BUBBLES) {
        const oldest = [...activeBubbles][0];
        if (oldest) removeBubble(oldest);
    }

    // Convert screen coordinates to window coordinates
    // Since window is fullscreen, screen coords should match window coords
    // But let's account for any potential offset
    const windowX = copyX - window.screenX;
    const windowY = copyY - window.screenY;
    
    console.log('Converted to window coordinates:', windowX, windowY);
    
    // Use the position captured at copy moment
    createBubble(text, windowX, windowY);
});

// Listen for welcome bubble event on app startup
listen('welcome-bubble', () => {
    const welcomeText = 'ClipBubble - Welcome! Copy text to see bubbles appear.';
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    createBubble(welcomeText, centerX, centerY);
});

window.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
});

window.addEventListener('mouseleave', () => {
    pointerX = -9999;
    pointerY = -9999;

    for (const entry of activeBubbles) {
        if (entry.hovered) {
            collapseBubble(entry);
        }
    }
});

window.requestAnimationFrame(animate);
