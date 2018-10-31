$('#jobForm').submit((e) => {
    e.preventDefault();
    //получаем необходимые значения
    let activeText = $('#active-text').text().trim();
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
            success: function(data){
                console.log(data);
            },
        });
    } else {
        alert("Возникли проблемы с отправкой данных. Обновите страницу и попробуйте снова.");
    }
});
