const express = require('express')
const app = express()
const registerShutdown = require('./sigint')
const fs = require('fs')
const path = require('path')

// Middleware
const bodyParser = require('body-parser')
const morgan = require('morgan')

// Configs
const PORT = process.env.NODE_PORT || 3001
const swaggerYaml = fs.readFileSync(path.join(__dirname, './swagger.yaml'), 'utf8')

// Basic middleware
app.use(morgan('common'))
app.use(bodyParser.json())

// Static assets
app.use(express.static(path.join(__dirname, 'build')));

// Routes
app.get('/health', (req,res,next) => {
  res.send('healthy')
})

app.get('/swagger.yaml', (req,res,next) => {
  res.send(swaggerYaml)
})

app.get('/cookie', (req,res,next) => {
  const { cookie='cors-server', value='bob' } = req.query
  res.cookie(cookie, value, { maxAge: 900000 });
  res.send({
    cookie: {
      [cookie]: value
    }
  })
})

app.use('/query', (req,res,next) => {
  const allowOrigin = req.query['allow-origin']
  const allowHeaders = req.query['allow-headers']
  const allowCredentials = req.query['allow-credentials']
  const allowMethods = req.query['allow-methods']

  let allowOriginHeader = {}
  if(allowOrigin === '$echo')
    allowOriginHeader = { 'Access-Control-Allow-Origin': req.headers.origin }
  else if(allowOrigin)
    allowOriginHeader = { 'Access-Control-Allow-Origin': allowOrigin }

  let allowHeadersHeader = {}
  if(allowHeaders === '$echo')
    allowHeadersHeader = { 'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || Object.keys(req.headers).join(',') }
  else if(allowHeaders)
    allowHeadersHeader = { 'Access-Control-Allow-Headers': allowHeaders }

  let allowMethodsHeader = {}
  if(allowMethods === '$all')
    allowMethodsHeader = { 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH,TRACE' }
  else if(allowMethods === '$echo')
    allowMethodsHeader = { 'Access-Control-Allow-Methods': req.headers['access-control-request-method'] || req.method }
  else if(allowMethods)
    allowMethodsHeader = { 'Access-Control-Allow-Methods': allowMethods }

  let allowCredentialsHeader = {}
  if(allowCredentials === 'true')
    allowCredentialsHeader = { 'Access-Control-Allow-Credentials': 'true' }

  if(req.method === 'OPTIONS') {

    res.set({
      ...allowOriginHeader,
      ...allowMethodsHeader,
      ...allowHeadersHeader,
      ...allowCredentialsHeader,
      'Access-Control-Max-Age': 1,
    })
    res.status(204)
    return res.end()
  }


  const accessControlHeaders = {
      ...allowOriginHeader,
      ...allowMethodsHeader,
      ...allowHeadersHeader,
      ...allowCredentialsHeader,
    'Access-Control-Max-Age': 1,
  }

  res.set({ ...accessControlHeaders})

  res.send({
    body: req.body,
    headers: req.headers,
    query: req.query,
    accessControl: accessControlHeaders,
  })

})

// SPA
app.get((req,res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

// Start
const server = app.listen(PORT, () => {
  console.log('Server listening on http://' + server.address().address + ':' + server.address().port)
})

registerShutdown((signal, code) => {
  console.log(`Recieved signal(${signal}), shutting down server...`)
  server.close(() => {
    console.log(`Server stopped by ${signal} with value ${code}`)
    process.exit(128 + code);
  })
})
