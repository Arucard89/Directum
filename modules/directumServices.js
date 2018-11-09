const moment = require('moment');
const path = require('path');
const DOWNLOADS_PATH = '/downloads/';
const JOB_KINDS = ['Задание','Уведомление','Задание-контроль'];

moment.locale('ru');

class DirectumServices {

    constructor(systemcode = 'DIRECTUM'){
        this.directum = new (require('./directum'))(systemcode);
        this.jobsCollection = [];
        this.directumUsersGroup = [];
    }

    /**
     * Получить информацию о задании по ИД
     * @param id
     * @returns {{JobInfo: *, job: *, Performer: string, Author: string, Subject: string, JobKind: *, State: string, JobFinalDate: string, JobID: (RegExp|*), TaskID: *, JobText: *, FullText: *, AccessRights: *}|*}
     */
    getJobInfo(id){
        let result;
        let job;
        job = this.directum.Jobs.GetObjectByID(id);
        let JobInfo = job.Info;
        let JobText = job.DetailDataSet(5);
        let locate = JobText.Locate('JobID',id);
        let CurrentJobText = JobText.Requisites('Text').AsString;
        result = {
            JobInfo,
            job,
            Performer : JobInfo.Performer.FullName,
            Author : JobInfo.Author.FullName,
            Subject : JobInfo.Name,
            JobKind : JobInfo.JobKind,
            JobKindName : JOB_KINDS[JobInfo.JobKind],
            State : JobInfo.State.Name,
            JobFinalDate : moment(JobInfo.DeadLine).format('DD.MM.YYYY HH:mm:ss'),
            ModifyDate: moment(JobInfo.Modified).format('DD.MM.YYYY HH:mm:ss'),
            JobID : JobInfo.ID,
            TaskID : JobInfo.TaskID,
            JobText : CurrentJobText,
            FullText : job.GetFullText(true),
            AccessRights: job.AccessRights,
        };
        //проверяем дату(если присутствует год 1899, значит, не установлена)
        result.JobFinalDate = result.JobFinalDate.indexOf('1899') === -1  ? result.JobFinalDate : '';
        this.jobsCollection[id] = result;
        return result;
    }

    /**
     * получить объект пользователя по имени пользователя
     * @param name string
     * @returns {*} IUser
     */
    getUserByName(name){
        return this.directum.ServiceFactory.GetUserByName(name.toLowerCase().replace('gt\\',''));
    }

    /**
     * получить информацию о блокировке объекта(ILock)
     * @param object
     * @returns {{HostName: *, Locked: *, LockedByThis: *, ObjectID: *, ObjectType: *, SystemCode: *, UserName: *}}
     */
    getLockInfo(object){
        let result = {};
        result = {
            GlobalLock: object.GlobalLock,
            HostName: object.GlobalLock.HostName,
            Locked: object.GlobalLock.Locked,
            LockedByThis: object.GlobalLock.LockedByThis,
            ObjectID: object.GlobalLock.ObjectID,
            ObjectType: object.GlobalLock.ObjectType,
            SystemCode: object.GlobalLock.SystemCode,
            UserName: object.GlobalLock.UserName,
        };
        return result;
    };

    /**
     * убрать блокировку с объекта
     * @param object
     * @returns {boolean}
     */
    unlockObject(object){
        try {
            let lockInfo = this.getLockInfo(object);
            if (lockInfo.LockedByThis) {
                lockInfo.GlobalLock.UnlockObject();
                return true
            } else {
                return false
            }
        } catch (e) {
            return false;
        }
    }

    /**
     * получить список пользователей в группе
     * @param groupName
     * @returns {*} IUserList
     */
    getUsersInGroup(groupName){
        let groupObject = this.directum.ServiceFactory.GetGroupByName(groupName);
        return this.directum.ServiceFactory.GetGroupMembers(groupObject);
    }

    /**
     * Проверить наличие пользователя в группе
     * @param userName
     * @param groupName
     * @returns {*}
     */
    checkUserInGroup(userName, groupName){
        let userObject = this.getUserByName(userName);
        let userList = this.getUsersInGroup(groupName);
        return userList.Find(userObject);
    }

    /**
     * получить список вложений(только документы ctEDocument = 8)
     * @param job
     * @returns {*} Info массив
     */
    getAttachmentsList(job) {
        let atts = [];
        let attObj = job.GetAttachments(true).Values;
        attObj.Reset();
        while (!attObj.EOF) {
            let attachment = attObj.Value.ObjectInfo;
            if (attachment.ComponentType == 8){
                atts.push(attachment)
            }
            attObj.Next();
        }
        return atts;
    }

    /**
     * получает список доступных пользователю вложений(инфо)
     * @param job
     * @param userName
     * @returns {Array} info
     */
    getAttachmentListForUser(job, userName){
        let attForUser = [];
        let userObject = this.getUserByName(userName);
        let attList = this.getAttachmentsList(job);
        if (attList) {
            for(let att of attList) {
                let doc = this.directum.EDocuments.getObjectByID(att.ID);
                // Проверить права на документ у пользователя, если есть права то добавлять, иначе пропускать
                let accessRights = doc.AccessRights;
                if (accessRights.UserCanRead(userObject)){
                    attForUser.push(att);
                }
                this.unlockObject(doc);
            }
        }
        return attForUser;
    }

    /**
     * получаем основные параметры документа для отображения по Info
     * @param docInfo
     * @returns {{fileExtension: *, sizeFile: *, docName: string, docInfo: *, lastVersionDoc: *}}
     */
    getDocumentPropertiesByInfo(docInfo){
        let doc = this.directum.EDocuments.getObjectByID(docInfo.ID);
        let oneVersionDoc = this.getLastVersion(doc);
        let fileExtension = oneVersionDoc.Editor.Extension;
        let sizeFile = oneVersionDoc.Size;
        let docName = docInfo.Name;
        this.unlockObject(doc);
        return {
            fileExtension,
            sizeFile,
            docName,
            docInfo,
        }
    }

    /**
     * получаем основные параметры документа для отображения по id
     * @param ID
     * @returns {{fileExtension: *, sizeFile: *, docName: string, docInfo: *, lastVersionDoc: *}}
     */
    getDocumentPropertiesByID(ID){
        let doc = this.directum.EDocuments.getObjectByID(ID);
        let oneVersionDoc = this.getLastVersion(doc); //последняя версия документа
        let fileExtension = oneVersionDoc.Editor.Extension.toLowerCase();
        let sizeFile = oneVersionDoc.Size;
        let docName = doc.Name;
        this.unlockObject(doc);
        return {
            fileExtension,
            sizeFile,
            docName,
            docInfo: doc.ObjectInfo,
        }
    }

    /**
     * загрузка документа из директума в папку
     * @param id
     * @param userName
     * @param pathForDownload
     * @returns {string}
     */
    downloadDocument(id, userName, pathForDownload = ""){
        //todo добавить флаг перезаписи файла.(проверять наличие файла в папке, если уже есть и флаг установлен, то перезаписывать, если не установлен, то, просто, возвращать путь)
        let docPath = '';
        let docLastVersion;
        try {
            let doc = this.directum.EDocuments.getObjectByID(id);
            // Проверить права на документ у пользователя, если есть права то экспортируем, иначе пропускать
            let accessRights = doc.AccessRights;
            if (accessRights.UserCanRead(this.getUserByName(userName))) {
                //определяем путь
                let docProps = this.getDocumentPropertiesByID(id);
                if (!pathForDownload) {
                    docPath = `${DOWNLOADS_PATH}${id}.${docProps.fileExtension}`;
                    docPath = path.join(global.appRoot, docPath);
                } else {
                    docPath = pathForDownload;
                }
                docLastVersion = this.getLastVersion(doc);
                docLastVersion.Export(docPath);
                this.unlockObject(docLastVersion);
            } else {
                console.log(`У пользователя ${userName} нет прав на документ id=${id}`);
            }
        } catch (e) {
            console.log(e);
            this.unlockObject(docLastVersion);
        }
        return docPath;
    }

    /**
     * получить последнюю версию документа
     * @param doc объект документа
     * @returns {*} ссылка на последнюю версию документа
     */
    getLastVersion(doc){
        let lastVersion = doc.Versions.Values(doc.Versions.Count - 1); //последняя версия документа
        this.unlockObject(lastVersion);
        return lastVersion;
    }

}
module.exports = DirectumServices;