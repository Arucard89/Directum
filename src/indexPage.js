$('#jobForm').submit((e) => {
    e.preventDefault();
    //получаем необходимые значения
    let activeText = $('#active-text').val().trim();
    let jobId = $('#id').text();
    let subject = $('#subject').text();

    //сравниваем ID, чтобы убедиься в правильности
    let headerID = $('#main-header').text().replace('Задание ИД: ','').trim();

    if (jobId === headerID){
        //ид в заголовке и ид в футере совпадают, здачит, отправляем на сервер
        $.ajax({
            type: 'POST',
            url: '/performJob',
            data: JSON.stringify({
                id:jobId,
                activeText,
                subject
            }),
            contentType: 'application/json',
            success: getResponseFromServer,
        });
    } else {
        alert("Возникли проблемы с отправкой данных. Обновите страницу и попробуйте снова.");
    }
});

function getResponseFromServer(data) {
    let elem;
    $('#success-message').css('display','none');
    $('#error-message').css('style','none');
    $('#message').css('style','none');
    if (data.error){
        elem = $('#error-message');
        elem.text(data.error);
        elem.removeAttr('style');
    } else if (data.success) {
        elem = $('#success-message');
        elem.text(data.success);
        elem.removeAttr('style');
        //обновляем текст задачи
        let taskText = data.text ? data.text : $('#task-text').text();
        $('#task-text').text(taskText);
        $('#active-text-container').css('display','none');
    } else if (data.message) {
        elem = $('#message');
        elem.text(data.message);
        elem.removeAttr('style');
    }

}
