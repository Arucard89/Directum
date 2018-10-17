const moment = require('moment');

class DirectumServices {

    constructor(systemcode = 'DIRECTUM'){
        this.directum = new (require('./directum'))(systemcode);
    }

    getJobInfo(id){
        let result;
        let job = this.directum.Jobs.GetObjectByID(id);
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
            JobState : JobInfo.State.Name,
            JobFinalDate : moment(JobInfo.DeadLine).format('DD.MM.YYYY hh:mm:ss'),
            JobID : JobInfo.ID,
            TaskID : JobInfo.TaskID,
            JobText : CurrentJobText,
        };
        return result;
    }
 }
