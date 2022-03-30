function getImageFromInput(input) {
    let reader = new FileReader();

    let imageCanvas = document.getElementById("imageCanvas");
    let context = imageCanvas.getContext("2d");

    let maxSize = 50;

    reader.addEventListener("loadend", function(arg) {
        var src_image = new Image();

        src_image.onload = function() {
            let divisionNumber = (src_image.height + src_image.width) / 2;
            let widthRelative = src_image.width / divisionNumber;
            let heightRelative = src_image.height / divisionNumber;

            imageCanvas.height = maxSize * heightRelative;
            imageCanvas.width = maxSize * widthRelative;

            // https://stackoverflow.com/a/61259685/18231525
            createImageBitmap(src_image, 
                {resizeWidth: (maxSize * widthRelative), resizeHeight: (maxSize * heightRelative), resizeQuality: "high"})
                .then(imageBitmap => context.drawImage(imageBitmap, 0, 0))
                .then(() => doTheAscii(context.getImageData(0, 0, imageCanvas.width, imageCanvas.height)));

        }

        src_image.src = this.result;
    });

    reader.readAsDataURL(input.files[0]);
}

function doTheAscii(imageData) {
    console.log(imageData);
    console.log("grayscale", getGrayScaleImageData(imageData));
    let grayScale = getGrayScaleImageData(imageData);

    let grayScaleCanvas = document.getElementById("grayScaleCanvas");
    
    createImageBitmap(grayScale.data).then(function(imgBitmap) {
        grayScaleCanvas.getContext("2d").drawImage(imgBitmap, 0, 0);
    });

    drawAscii(grayScale.canvas2d);
}

function drawAscii(canvas2d) {
    let asciiString = "";
    for (let y = 0; y < canvas2d.length; y++) {
        for (let x = 0; x < canvas2d[y].length; x++) {
            let pixelValue = canvas2d[y][x].y;
            if (pixelValue <= 50) {
                asciiString += "&&";
            } else if (pixelValue <= 150 && pixelValue > 50) {
                asciiString += ";;";
            } else if (pixelValue <= 200 && pixelValue > 150) {
                asciiString += "..";
            } else {
                asciiString += "  ";
            }

            console.log("test");
        }
        asciiString += "\n";
    }

    let output = document.getElementById("output");
    output.innerHTML = asciiString;
}


function getGrayScaleImageData(imageData) {
    let oldImageData = imageData;
    let pixels = imageData.data; // r g b a

    // grayscalingimage
    let rgbaObjects = [];
    for (let i = 0; i < pixels.length/4; i++) {
        let rgba = {r: pixels[i * 4], g: pixels[i * 4 + 1], b: pixels[i * 4 + 2], a: pixels[i * 4 + 3]};

        // https://stackoverflow.com/a/24213274
        let luminance = Math.round(Math.sqrt(0.299 * rgba.r**2 + 0.587 * rgba.g**2 + 0.114 * rgba.b**2));
        rgbaObjects.push({y: luminance, a: rgba.a});
    }

    // convert to 2 dimensional array
    let canvas2d = [];
    for (let y = 0; y < oldImageData.height; y++) {
        canvas2d.push([]);
        for (let x = 0; x < oldImageData.width; x++) {
            canvas2d[y][x] = rgbaObjects[x + y * oldImageData.width];
        }
    }

    let newDataArray = new Uint8ClampedArray(canvas2d.length * canvas2d[0].length * 4);
    let index = 0;
    for (let y = 0; y < canvas2d.length; y++) {
        for (let x = 0; x < canvas2d[y].length; x++) {
            newDataArray[index] = canvas2d[y][x].y;
            newDataArray[index + 1] = canvas2d[y][x].y;
            newDataArray[index + 2] = canvas2d[y][x].y;
            newDataArray[index + 3] = canvas2d[y][x].a;
            index += 4;
        }
    }

    let newData = new ImageData(newDataArray, oldImageData.width, oldImageData.height);

    return {data: newData, canvas2d: canvas2d};
}