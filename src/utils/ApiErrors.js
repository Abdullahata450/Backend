class ApiError extends Error{
    constructor(
        statuscode,
        message="Something Went Wrong",
        erros=[],
        stack="",
    ){
        super(message)
        this.statuscode=statuscode
        this.data=null
        this.message=message
        this.success=false
        this.erros=erros

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }


    }
}
export {ApiError}