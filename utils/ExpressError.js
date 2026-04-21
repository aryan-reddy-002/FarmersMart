class ExpressError extends Error{
    constructor(Status,message){
        super();
        this.status=Status;
        this.message=message;
    }
}
module.exports = ExpressError;