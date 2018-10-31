const moment = require('moment');

moment.locale('ru');

class DirectumServices {

    constructor(systemcode = 'DIRECTUM'){
        this.directum = new (require('./directum'))(systemcode);
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
            State : JobInfo.State.Name,
            JobFinalDate : moment(JobInfo.DeadLine).format('DD.MM.YYYY hh:mm:ss'),
            ModifyDate: moment(JobInfo.Modified).format('DD.MM.YYYY hh:mm:ss'),
            JobID : JobInfo.ID,
            TaskID : JobInfo.TaskID,
            JobText : CurrentJobText,
            FullText : job.GetFullText(true),
            AccessRights: job.AccessRights,
        };
        //проверяем дату
        result.JobFinalDate = result.JobFinalDate > moment(0) ? result.JobFinalDate : '';
        return result;
    }

    /**
     * получить объект пользователя по имени пользователя
     * @param name string
     * @returns {*} IUser
     */
    getUserByName(name){
        return this.directum.ServiceFactory.GetUserByName(name);
    }
 }
module.exports = DirectumServices;