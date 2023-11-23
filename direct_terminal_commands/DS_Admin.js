const JSONdb = require('simple-json-db');
const db_main = new JSONdb('./user_data/dutystates.json');

module.exports = {
    data: {
        name: "dsprofileedit"
    },
    execute: async (text,client) => {
        console.log("DSPFEDIT v1.0.0")
        const db = client.dutystate_db
        const cmd = text.split(" ")

        if(cmd[1] === 'resetlinks'){
            const target = cmd[2] || null
            if(!target){
                console.log("Missing target: dsprofileedit resetlinks <target:discordID>")
                return
            }

            const profile = db.get("profile-"+target)
            if(!profile){
                console.log("User has no profile")
                return
            }

            profile.links = ""
            db.set("profile-"+target, profile)
            console.log("Reset links!")

            return

        }

        if(cmd[1] === 'del'){
            const target = cmd[2] || null

            if(!target){
                console.log("Missing target: dsprofileedit del <target:discordID>")
                return
            }

            const profile = db.get("profile-"+target)
            if(!profile){
                console.log("User has no profile")
                return
            }

            db.delete("profile-"+target)
            let str = `Accepted: ${profile.accepted}\nRejected: ${profile.rejected}\nPending: ${profile.pending}\nGraded: ${profile.graded}`
            await import('boxen').then(b => {
                console.log(b.default(str))
            })

            return

        }

        if(cmd[1] === 'get'){
            const target = cmd[2] || null
            if(!target){
                console.log("Missing target: dsprofileedit get <target:discordID>")
                return
            }

            const profile = db.get("profile-"+target)
            if(!profile){
                console.log("User has no profile")
                return
            }

            else{
                let str = `Accepted: ${profile.accepted}\nRejected: ${profile.rejected}\nPending: ${profile.pending}\nGraded: ${profile.graded}`
                await import('boxen').then(b => {
                    console.log(b.default(str))
                })
                return
            }
        }
        const category = cmd[1] || null
        const target = cmd[2] || null
        const amount = cmd[3] || null

        if(!category || !target || !amount){
            console.error("Missing parameters: dsprofileedit category<accepted|rejected|graded> target<discordID> amount<+ve or -ve integer>")
            return
        }

        if(!['accepted','rejected','graded'].includes(category)){
            console.error("Incorrect Category: dsprofileedit category<accepted|rejected|graded> target<discordID> amount<+ve or -ve integer>")
            return
        }

        if(!target){
            console.log("Missing target: dsprofileedit category<accepted|rejected|graded> target<discordID> amount<+ve or -ve integer>")
            return
        }

        let profile = db.get("profile-"+target)
        if(!profile){
            console.log("User has no profile")
            console.log("Creating one now...")
            profile = {
                accepted: 0,
                rejected: 0,
                pending: 0,
                graded: 0,
                links: ""
            }
        }

        const oldval  = profile[category]
        try{
            profile[category] += parseInt(amount)
        }
        catch(error){
            console.error("Invalid Amount: Amount must be an integer")
            return
        }
        let strdelta = `Changed profile.${category}: ${oldval} => ${oldval + parseInt(amount)}`
        console.log(strdelta)
        let str = `Accepted: ${profile.accepted}\nRejected: ${profile.rejected}\nPending: ${profile.pending}\nGraded: ${profile.graded}`
        await import('boxen').then(b => {
            console.log(b.default(str))
        })


        db.set("profile-"+target, profile)


    },
    init: async(client) => {
        client.dutystate_db = db_main
    }
}