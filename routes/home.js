const express = require('express')
const router = express.Router();

router.get('', (req,res) => {
    return res.send({response: ' these are the endpoints :
/api/recent returns recent subbed drama.

/api/recentraw returns recent raw drama.

/api/recentkdrama returns recent kdrama.

/api/popular returns popular drama.

/api/ongoing returns ongoing drama.

/api/movies returns recent movies.

/api/detail/{id} returns details of drama'})
})

module.exports = router;
