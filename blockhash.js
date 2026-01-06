//Writing our own perceptual hashing function

const BlockHash = {
    compute : function(imgData){
        //we'll use 8x8 grid for the hash
        const size = 8;
        const len = imgData.width * imgData.height * 4;
        const data = imgData.data;
        let vals = [];

        //Now we'll convert into Grayscale
        for(let i=0; i<len; i+=4){
            vals.push((data[i] * 0.299) + (data[i+1] * 0.587) + (data[i+2] * 0.114));
        }

        //Resize into 8x8 blocks
        const blockWidth = Math.floor(imgData.width / size);
        const blockHeight = Math.floor(imgData.height / size);
        let blocks = [];

        for (let y=0; y < size; y++){
            for(let x=0; x<size; x++){
                let sum = 0;
                for(let by=0; by<blockHeight; by++){
                    for(let bx = 0; bx < blockWidth; bx++){
                        const idx = ((y * blockHeight + by) * imgData.width) + (x * blockWidth + bx);
                        sum += vals[idx];
                    }
                }
                blocks.push(sum / (blockWidth * blockHeight));
            }
        }

        //Calculate Median 
        const sorted = blocks.slice().sort((a,b) => a - b);
        const median = sorted[31];  

        //Generting Hash
        let hash = "";
        for(let i=0; i<64; i++){
            hash += (blocks[i] > median) ? "1" : "0";
        }

        //converting binary string to Hex for storage efficiency 
        return parseInt(hash, 2).toString(16);
    }
}