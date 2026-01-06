let isScanning = false;
let processedHashes = new Set();   //Stores hashes of photos we've kept
let processedElements = new WeakSet();  //Will track DOM elements we've already scanned 

//Config
const CONFIG = {
    scrollDelay : 2500,  
    blockHashSize: 8, 
    videoSkip: true
};

// UI Injection
function createControlPanel(){
    const panel = document.createElement('div');
    panel.id = "gphotos-deduper-panel";
    panel.innerHTML =  `
       <div class="panel-header">Pixel Clean</div>
        <div class="panel-stats">
            <div>Scanned: <span id="stat-scanned">0</span></div>
            <div>Duplicates Selected: <span id="stat-dupes">0</span></div>
            <div id="stat-status" class="status-idle">Idle</div>
        </div>
        <div class="panel-controls">
            <button id="panel-btn-start">Start Month Scan</button>
            <button id="panel-btn-stop" disabled>Stop</button>
            <button id="panel-btn-delete" class="btn-danger">Delete Selected</button>
        </div> 
    `;
    document.body.appendChild(panel);

    document.getElementById('panel-btn-start').onclick = startScan;
    document.getElementById('panel-btn-stop').onclick = stopScan;
    document.getElementById('panel-btn-delete').onclick = robustDelete;
};

async function startScan() {
    isScanning = true;
    updateStatus("Scanning...", "status-active");
    toggleButtons(true);
    scanLoop();
}

function stopScan(){
    isScanning = false;
    updateStatus("Stopped", "status-idle");
    toggleButtons(false);
}

async function scanLoop() {
    if(!isScanning) return;

    //1. Find all photos containers currently in the DOM
    
    const items = Array.from(document.querySelector('.rtIMgb'));

    let newItemsFound = false;

    for(const item of items){
        if(!isScanning) break;
        if(processedElements.has(item)) continue;   //skip if already checked 

        processedElements.add(item);
        newItemsFound = true;

        //video skip logic
        const ariaLabel = item.querySelector('[role="checkbox"]')?.getAttribute('aria-label') || "";
        const hasDurationBadge = item.querySelector('.KhS5De'); //duration badge class from my HTML

        if(ariaLabel.startsWith("Video") || hasDurationBadge){
            console.log("Skipping Video");
            continue;
        }

        //3. Extract Image URL
        const bgDiv = item.querySelector('.RY3tic');
        if(!bgDiv) continue;

        //Parsing Url from style
        const style = bgDiv.style.backgroundImage;
        const urlMatch = style.match(/url\("?(.*?)"?\)/);

        if(urlMatch && urlMatch[1]){
            updateStatus("Hashing....", "status-active");

            try {
                // Hash the image
                const hash = await generateHash(urlMatch[1]);

                //comare hash
                if(processedHashes.has(hash)){
                    //Duplicate found
                    console.log("Duplicated found:", hash);
                    selectItem(item);
                    duplicateCount++;
                    document.getElementById('stat-dupes').innerText = duplicateCount;
                } else {
                    //Unique
                    processedHashes.add(hash);
                }

                //Update scanned count 
                const scannedCount = parseInt(document.getElementById('stat-scanned').innerText) + 1;
                document.getElementById('stat-scanned').innerText = scannedCount;

            } catch (error) {
                console.error("Hashing failed for item", err);
            }
        }

        //Scroll Logic
        if(isScanning){
            updateStatus("Scrolling...", "status-active");
            window.scrollBy(0, window.innerHeight * 0.8);

            //random pause to mimic human 
            const delay = CONFIG.scrollDelay + (Math.random() * 1000);
            setTimeout(scanLoop, delay);
        }
    }


}

async function generateHash(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = function(){
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            //Resize to small generic size for hashing (e.g., 64x64)
            canvas.width = 64;
            canvas.height = 64; 
            ctx.drawImage(img, 0, 0, 64, 64);

            const imgData = ctx.getImageData(0, 0, 64, 64);

            const hash = window.BlockHash.compute(imgData);
            resolve(hash);
        }
        img.onerror = reject;
    })
}

function selectItem(itemElement){
    const checkbox = itemElement.querySelector('.QcpS9c[role="checkbox"]');
    if(checkbox && checkbox.getAttribute('aria-checked') === "false"){
        checkbox.click();
    }
}

async function robustDelete() {
    if (!confirm(`Are you sure you want to delete ${duplicateCount} selected items?`)) return;

    updateStatus("Deleting...", "status-danger");

    //Simulate "#" key press
    const keyEvent = new KeyboardEvent('keydown', {
        key: '#',
        code: 'Digit3',
        keyCode: 51,
        bubbles: true,
        cancelable: true,
        shiftKey: true 
    });
    document.dispatchEvent(keyEvent);

    //2. Wait for Modal and Click confirm
    setTimeout(() => {
        const confirmBtn = document.querySelector('button[aria-label="Move to trash"]');
        if(confirmBtn){
            confirmBtn.click();
            updateStatus("Deleted!", "status-idle");
            processedHashes.clear(); 
        } else {
            alert("Could not find confirmation dialog. Please delete manually.")
        }
    }, 1000);
}

function updateStatus(text, className){
    const el = document.getElementById('stat-status');
    el.innerText = text;
    el.className = className;
}

function toggleButtons(scanning){
    document.getElementById('panel-btn-start').disabled = scanning;
    document.getElementById('panel-btn-stop').disabled = !scanning;
}

//intialize
createControlPanel();