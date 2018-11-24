const firstClass = 'b-blue';
const secondClass = 'b-red';
let OKButton = document.getElementById('ok-button');
OKButton.onclick = (e) => {
    //скрываем вывод результата
    let res = document.getElementById('results');
    res.style.display = 'none';

    let mainInput = document.getElementById('main-input');
    let inputArr = refactorInput(mainInput.value);

    //заполняем ввод
    if (inputArr.length === 0){
        alert('Введите, пожалуйста, массив');
    } else {
        //выводим чистый массив ввода и отображаем введенную информацию
        fulfillArray(inputArr);
        let outputPrefix = 'show-output';
        fulfillArray(inputArr,'show-output');
        res.style.display = '';
        //сортируем и получаем массив перестановок
        let swaps = bubbleSort(inputArr);
        let swapsLength = swaps.length;
        //проверяем, есть ли перестановки
        if (swapsLength === 0){
            alert('Сортировка не требуется, т.к. исходный массив отсортирован');
        } else {
            //Показываем их
            let currentSwap = 0;
            let intervalID = setInterval(() => {
                let elem;
                if (currentSwap > 0) {
                    elem = swaps[currentSwap - 1];
                    document.getElementById(`${outputPrefix}_${elem.i}`).classList.remove(firstClass);
                    document.getElementById(`${outputPrefix}_${elem.j}`).classList.remove(secondClass);
                    if (currentSwap >= swapsLength) {
                        clearInterval(intervalID);
                        alert('Сортировка массива закончена');
                        return;
                    }
                }
                elem = swaps[currentSwap];
                document.getElementById(`${outputPrefix}_${elem.i}`).classList.add(firstClass);
                document.getElementById(`${outputPrefix}_${elem.j}`).classList.add(secondClass);

                swapElements(elem.i,elem.j);
                currentSwap++;
            }, 1500);
        }
    }
};

function refactorInput(s) {
    let arr = s.replace(/[^0-9,]*/g,'').split(',');
    let res = [];
    for (let a of arr) {
        if (a !== '') {
            res.push(Number(a));
        }
    }
    return res;
  //.map((item) => {
    //     if (item !=='') {
    //         return Number(item)
    //     }
    // });//.filter((item) => item !== '').map(Number);
}

function bubbleSort(arr) {
    let arrayOfChanges = [];
    for (let i = 0, endI = arr.length - 1; i < endI; i++) {
        let wasSwap = false;
        for (let j = 0, endJ = endI - i; j < endJ; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                arrayOfChanges.push({'i':j, 'j':j+1});
                //swapElements(j,j+1);
                wasSwap = true;
            }
        }
        if (!wasSwap) break;
    }
    //console.log(arrayOfChanges);
    return arrayOfChanges;
}

function createPanelForItem(ind = 0, item = 0, prefix = 'id') {
    //создаем контейнер панели
    let divCol = document.createElement('div');
    divCol.className = 'col-xs-1';
    //создаем панель
    let divPanel = document.createElement('div');
    divPanel.className = 'panel panel-default';
    //создаем заголовок и тело панели
    let divPanelHeader = document.createElement('div');
    divPanelHeader.classList.add('panel-heading');
    divPanelHeader.classList.add('array-inds');
    divPanelHeader.innerText = ind;

    let divPanelBody = document.createElement('div');
    divPanelBody.classList.add('panel-body');
    divPanelBody.classList.add('array-items');
    divPanelBody.innerText = item;
    divPanelBody.id = `${prefix}_${ind}`;
    //формируем элемент
    divPanel.appendChild(divPanelHeader);
    divPanel.appendChild(divPanelBody);
    divCol.appendChild(divPanel);
    return divCol;
}

function fulfillArray(arr, id = 'show-input') {
    let l = arr.length;
    let cont = document.getElementById(id);
    cont.innerHTML = '';
    for (let i = 0; i < l; i++){
        createPanelForItem(i, arr[i]);
        cont.appendChild(createPanelForItem(i, arr[i], id));
    }
}

function swapElements(i, j, prefix = 'show-output'){
    let divI = document.getElementById(`${prefix}_${i}`);
    let divJ = document.getElementById(`${prefix}_${j}`);
    [divI.innerText, divJ.innerText] = [divJ.innerText, divI.innerText];
}


//todo добавить стиль для отображения текста внутри элемента полностью



