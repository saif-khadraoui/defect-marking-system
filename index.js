const express = require("express")
const cors = require("cors")
const axios = require("axios")
const port = 5000

const app = express()
app.use(cors())
app.use(express.json())
require('dotenv').config()

app.post("/addComment", async (req, res) => {
  console.log("Body from jira:" + req.body)
  const issue = await fetchIssue("SEARCH-664")
  console.log("ISSUE: " + issue)
  const calculatedScore = calculateScore(issue);
  const suggestions = returnSuggestions(issue);

  try{
      const response = await axios.post("https://mimecast.jira.com/rest/api/latest/issue/SEARCH-664/comment", 
          {
            body: `[~accountid:${issue.fields.reporter.accountId}]
                  
                  🎯 Jira Ticket Score: ${calculatedScore}/10

                  This score evaluates how detailed and complete this ticket is based on the information provided. A higher score means the ticket contains sufficient details to assist the assignee in addressing it effectively.

                  ✅ Suggestions for improvement:
                  ${suggestions}

                  Thank you for helping us keep our tickets well documented! 🚀
                  `
          },
          {
        headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.EMAIL}:${process.env.JIRA_API_KEY}`
            ).toString('base64')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )
      res.send(response.data)
      console.log("tried request")
  } catch(err) {
      console.log(err.message)
      res.send(err)
  }
})

app.put("/updateComment", async (req, res) => {
  const commentId = await fetchCommentId("SEARCH-664")
  console.log("COMMENT ID: " + commentId)

  const issue = await fetchIssue("SEARCH-664")
  console.log("ISSUE: " + issue)
  const calculatedScore = calculateScore(issue);
  const suggestions = returnSuggestions(issue);

  try{
    const response = await axios.put(`https://mimecast.jira.com/rest/api/latest/issue/SEARCH-664/comment/${commentId}`, 
      {
        body: `[~accountid:${issue.fields.reporter.accountId}]
              
              🎯 Jira Ticket Score: ${calculatedScore}/10

              This score evaluates how detailed and complete this ticket is based on the information provided. A higher score means the ticket contains sufficient details to assist the assignee in addressing it effectively.

              ✅ Suggestions for improvement:
              ${suggestions}

              Thank you for helping us keep our tickets well documented! 🚀
              `
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.EMAIL}:${process.env.JIRA_API_KEY}`
          ).toString('base64')}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(response.data)
    res.send(response.data)
    return response.data
  } catch(err) {
    console.log(err)
    return "Failed to update comment"
  }

})



function calculateScore(issue) {
  var assignedScore = 10
  const weight = 10 / 7

  if(issue.fields.assignee == null) {
    assignedScore -= weight
  }

  if(issue.fields.labels.length == 0){
    assignedScore -= weight
  }

  if(issue.fields.duedate == null){
    assignedScore -= weight
  }

  if(issue.fields.priority.name == null){
    assignedScore -= weight
  }

  if(issue.fields.summary == null){
    assignedScore -= weight
  }

  if(issue.fields.description == null) {
    assignedScore -= weight
  }

  // Team field
  if(issue.fields.customfield_13679 == null) {
    assignedScore -= weight
  }


  return assignedScore.toFixed(2)
}

function returnSuggestions(issue) {

  var suggestions = ""

  if(issue.fields.assignee == null) {
    suggestions += "- Add an assignee \n"
  }

  if(issue.fields.labels.length == 0){
    suggestions += "- Add a label \n"
  }

  if(issue.fields.duedate == null){
    suggestions += "- Add a duedate \n"
  }

  if(issue.fields.priority.name == null){
    suggestions += "- Add a priority \n"
  }

  if(issue.fields.summary == null){
    suggestions += "- Add a summary \n"
  }

  if(issue.fields.description == null) {
    suggestions += "- Add a description \n"
  }

  // Team field
  if(issue.fields.customfield_13679 == null) {
    suggestions += "- Add a team \n"
  }

  return suggestions
  
}

const fetchIssue = async (payload) => {

  try{
    const response = await axios.get(`https://mimecast.jira.com/rest/api/latest/issue/${payload}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.EMAIL}:${process.env.JIRA_API_KEY}`
        ).toString('base64')}`,
        Accept: 'application/json',
      }
    })
    return response.data
  } catch(err) {
    return "Unsuccessful fetching of issue"
  }

}

const fetchCommentId = async (payload) => {
  try{
    const response = await axios.get(`https://mimecast.jira.com/rest/api/latest/issue/${payload}/comment`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.EMAIL}:${process.env.JIRA_API_KEY}`
        ).toString('base64')}`,
        Accept: 'application/json',
      }
    })

    const comment = response.data.comments.filter((comment) => comment.body.includes("🎯 Jira Ticket Score"))
    console.log("COMMENT: " + JSON.stringify(comment[0]))
    return comment[0] ? comment[0].id : null

  } catch(err) {
    console.log(err)
    return "Unsuccessful fetching of comment"
  }
}



app.listen(port, () => {
    console.log("server started")
})
