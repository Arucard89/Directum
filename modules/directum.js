/**
 * Класс предоставляет интерфейс для работы с Directum, который максимально приближен к ISBL
 */

let ax = require('winax');

class Directum {
    constructor(systemcode = 'DIRECTUM'){
        let lp = new ax.Object('SBlogon.LoginPoint');
        this.Application = lp.GetApplication(`systemcode=${systemcode}`);   //объект-приложение
        this.Connection = this.Application.Connection;                      //объект-соединение с сервером БД
        this.OurFirm = this.Application.OurFirmContext;                     //текущий контекст Нашей организации
        this.References = this.Application.ReferencesFactory;               //фабрика типов справочников
        this.Reports = this.Application.ReportFactory;                      //фабрика отчетов
        this.Scripts = this.Application.ScriptFactory;                      //фабюрика сценариев
        this.EDocuments = this.Application.EDocumentFactory;                //фабрика документов
        this.Folders = this.Application.FolderFactory;                      //фабрика папок
        this.Tasks = this.Application.TaskFactory;                          //фабрика задач
        this.Jobs = this.Application.JobFactory;                            //фабрика заданий
        this.ComponentTokens = this.Application.ComponentTokenFactory;      //фабрика вариантов запуска компонент
        this.Search = this.Application.SearchFactory;                       //фабрика поисков
        this.ServiceFactory = this.Application.ServiceFactory;              //фабрика служебных объектов
    }

}
module.exports = Directum;