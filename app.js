// REF: https://developers.google.com/gmail/api/quickstart/nodejs?hl=zh-TW
const fs = require('fs')
const readline = require('readline')
const google = require('googleapis')
const googleAuth = require('google-auth-library')
const path = require('path')

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const SCOPES = ['https://www.googleapis.com/auth/gmail.compose']
const TOKEN_DIR = path.join((process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE), '.credentials')
const TOKEN_PATH = path.join(TOKEN_DIR, 'gmail-nodejs-quickstart.json')

// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
  if (err) {
    console.log('Error loading client secret file: ' + err)
    return
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  // authorize(JSON.parse(content), listLabels)
  authorize(JSON.parse(content), sendMessage)
})

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize (credentials, callback) {
  var clientSecret = credentials.installed.client_secret
  var clientId = credentials.installed.client_id
  var redirectUrl = credentials.installed.redirect_uris[0]
  var auth = new googleAuth()
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback)
    } else {
      oauth2Client.credentials = JSON.parse(token)
      callback(oauth2Client)
    }
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken (oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  console.log('Authorize this app by visiting this url: ', authUrl)
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        return
      }
      oauth2Client.credentials = token
      storeToken(token)
      callback(oauth2Client)
    })
  })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken (token) {
  try {
    fs.mkdirSync(TOKEN_DIR)
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token))
  console.log('Token stored to ' + TOKEN_PATH)
}

function sendMessage (auth) {
  const gmail = google.gmail('v1')
  let email_lines = []
  let from = 'ntuaha@gmail.com'
  let to = 'ntuaha@gmail.com'
  let subject = '你說什麼'
  let content = ['A是嘛', '<b>And the bold text goes here</b>']
  email_lines.push('From: ' + from)
  email_lines.push('To: ' + to)
  email_lines.push('Content-type: text/html;charset=utf8')
  email_lines.push('MIME-Version: 1.0')
  // http://dchesmis.blogspot.tw/2016/06/e-mailutf8.html
  email_lines.push('Subject:' +"=?UTF-8?B?"+new Buffer(subject,'utf8').toString('base64')+"?=")
  
  email_lines.push('')
  content.forEach((line) => {
    email_lines.push(line)
  })
  let email = email_lines.join('\r\n').trim()
  console.log(email_lines.map((line) => new Buffer(line).toString('base64')))
  console.log(new Buffer(email,'utf8').toString('base64'))
  let base64EncodedEmail = new Buffer(email,'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  console.log(base64EncodedEmail)

  const sendDone = (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err)
      return
    }
    console.log('send mail success', response)
  }

  gmail.users.messages.send({
    auth: auth,
    userId: 'me',
    resource: {
      raw: base64EncodedEmail
    }
  }, sendDone)
}
