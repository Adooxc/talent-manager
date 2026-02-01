// New Instagram-style media gallery rendering function
function renderEditMediaGalleryInstagram() {
    const gridContainer = document.getElementById('edit-media-grid');
    const mainMedia = document.getElementById('edit-main-media');
    const infoDiv = document.getElementById('edit-media-info');
    
    gridContainer.innerHTML = '';
    
    if (editMediaItems.length === 0) {
        mainMedia.innerHTML = '<span style="color: white; font-size: 16px; opacity: 0.8;">📸 No media selected</span>';
        if (infoDiv) infoDiv.textContent = '0 media items';
        return;
    }
    
    // Update main preview
    const primary = editMediaItems[editPrimaryMediaIndex];
    mainMedia.innerHTML = '';
    if (primary.type === 'image') {
        const img = document.createElement('img');
        img.src = primary.src;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        mainMedia.appendChild(img);
    } else {
        const video = document.createElement('video');
        video.src = primary.src;
        video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        video.controls = true;
        mainMedia.appendChild(video);
    }
    
    // Create grid items
    editMediaItems.forEach((item, index) => {
        const gridItem = document.createElement('div');
        gridItem.draggable = true;
        gridItem.dataset.index = index;
        
        const isPrimary = index === editPrimaryMediaIndex;
        const borderColor = isPrimary ? '3px solid var(--primary)' : '2px solid var(--border)';
        
        gridItem.style.cssText = `
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            border-radius: 8px;
            cursor: pointer;
            border: ${borderColor};
            overflow: hidden;
            transition: all 0.2s;
            background: rgba(0,0,0,0.1);
        `;
        
        if (item.type === 'image') {
            gridItem.innerHTML = '<img src="' + item.src + '" style="width: 100%; height: 100%; object-fit: cover;">';
        } else {
            gridItem.innerHTML = '<video src="' + item.src + '" style="width: 100%; height: 100%; object-fit: cover;"></video><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px;">▶</div>';
        }
        
        // Primary badge
        if (isPrimary) {
            const badge = document.createElement('div');
            badge.style.cssText = 'position: absolute; top: 4px; left: 4px; background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;';
            badge.textContent = '⭐ PRIMARY';
            gridItem.appendChild(badge);
        }
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: var(--error); color: white; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; padding: 0; opacity: 0; transition: opacity 0.2s;';
        deleteBtn.textContent = '✕';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            editMediaItems.splice(index, 1);
            if (editPrimaryMediaIndex >= editMediaItems.length) {
                editPrimaryMediaIndex = Math.max(0, editMediaItems.length - 1);
            }
            renderEditMediaGalleryInstagram();
        };
        gridItem.appendChild(deleteBtn);
        
        // Show delete button on hover
        gridItem.onmouseenter = function() {
            deleteBtn.style.opacity = '1';
        };
        gridItem.onmouseleave = function() {
            deleteBtn.style.opacity = '0';
        };
        
        // Click to set as primary
        gridItem.onclick = function() {
            editPrimaryMediaIndex = index;
            renderEditMediaGalleryInstagram();
        };
        
        // Drag and drop
        gridItem.ondragstart = function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
        };
        
        gridItem.ondragover = function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            gridItem.style.opacity = '0.7';
        };
        
        gridItem.ondragleave = function(e) {
            gridItem.style.opacity = '1';
        };
        
        gridItem.ondrop = function(e) {
            e.preventDefault();
            gridItem.style.opacity = '1';
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIndex !== index) {
                const [movedItem] = editMediaItems.splice(fromIndex, 1);
                editMediaItems.splice(index, 0, movedItem);
                if (editPrimaryMediaIndex === fromIndex) {
                    editPrimaryMediaIndex = index;
                }
                renderEditMediaGalleryInstagram();
            }
        };
        
        gridContainer.appendChild(gridItem);
    });
    
    if (infoDiv) infoDiv.textContent = editMediaItems.length + ' media item' + (editMediaItems.length !== 1 ? 's' : '');
}
