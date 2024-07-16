function imageToBase64(image, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        callback(event.target.result); // 去掉Base64前缀
    };
    reader.readAsDataURL(image);
}

const imageInput = document.getElementById('imageInput');
imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        imageToBase64(file, function(base64Image) {
            sendImageToServer(base64Image);
        });
    }
});

function sendImageToServer(base64Image) {
    console.log(base64Image)

    const url = 'http://13.250.152.52:8856/img/upload';
    const data = {
        uid: 13274,
        token: '46b25bb415057b888fa11cd4fca247f7',
        img: base64Image
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
