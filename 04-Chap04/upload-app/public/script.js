const progressBar =
    document.getElementById('progress');

const percentText =
    document.getElementById('percent');

let currentXhr = null;

function upload() {
    // Bước 1: Lấy file object từ FileList                                              ↑
    //   .files trả về FileList (array-like)
    //   [0] lấy file đầu tiên
    //   file = { name, size, type, lastModified }
    const file = document.getElementById("file").files[0];


    // Bước 2: Đóng gói dữ liệu thành multipart/form-data
    //   Tương đương HTML:  <input name="file" type="file">
    //   FormData tự thêm boundary, Content-Type header
    const formData = new FormData();
    formData.append("file", file);

    // Bước 3: Tạo XHR và gắn event upload.onprogress
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;

    xhr.upload.onprogress = (e) => {
        //   ↑ .upload là UploadProgressEvent object
        //     chỉ theo dõi phần gửi LÊN, không phải nhận về
        if (e.lengthComputable) {
            //      ↑ Không phải lúc nào server cũng biết trước total
            //        → phải check trước khi chia để tránh NaN
            const percent = Math.round(e.loaded * 100/e.total);
        }

        progressBar.value = percent;
        percentText.innerText = `${percentText} %`;
    }

    // Bước 4: Gửi request
    xhr.open('POST', '/upload');
    xhr.send(formData);

    // Bước 5: Nhận response
    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status <= 300) {
            alert('Upload Completed.');
        }
        else {
            alert(`HTTP Error: Status: ${xhr.status}, Response: ${xhr.responseText}`);
        }
    }
}

function cancelUpload() {
    if (currentXhr) currentXhr.abort();
}




