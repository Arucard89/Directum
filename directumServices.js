 class DirectumServices {
    constructor(systemcode = 'DIRECTUM'){
        this.directum = new (require('./directum'))(systemcode);
    }

    getJobInfo(id){
        let result;
        let job = this.directum.Jobs.GetObjectByID(id);
        let JobInfo = job.Info;
        result = {
            JobInfo,
            job,
            Performer : JobInfo.Performer.FullName,
            Author : JobInfo.Author.FullName,
            Subject : JobInfo.Name,
            JobKind : JobInfo.JobKind,
            JobState : JobInfo.State.Name,
            JobFinalDate : JobInfo.DeadLine,
            JobID : JobInfo.ID,
            //JobText: job.ActiveText,
            TaskID : JobInfo.TaskID,
           // JobText : job.DetailDataSet(5).RequisiteCount,//
        };
        return result;
    }
 }


let ds = new DirectumServices();
let ji = ds.getJobInfo(178384);

//console.log(ji);