const events = require("events");
module.exports = ({emitter, logger}) => {
    console.log("Init is called:",emitter)
    if(!emitter) emitter = new events.EventEmitter();
    if(!logger) logger = console;

    emitter.on("app:start", async() => {
        console.log("app start event is called")
    })

    emitter.on("db:success", async() => {
        try {
            await require("../db/seeders")();
            logger.info("[seeder] Finished successfully.")
        }
        catch(err)
        {
            logger.info("[seeder] Failed.")
        }
    })
}