const express = require('express')
const app = express()
const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const toDate = require('date-fns/toDate')
const isValid = require('date-fns/isValid')

app.use(express.json())
let db = null

const connectingdbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('serever is running at http://localhost/3000')
    })
  } catch (e) {
    console.log(`dberror:${e.message}`)
    process.exit(1)
  }
}
connectingdbandserver()

const checkingmiddlewarequery = async (request, response, next) => {
  const {status, priority, category, search_q, date} = request.query

  const {todoId} = request.params
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    if (statusArray.includes(status)) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const statusArray = ['HIGH', 'MEDIUM', 'LOW']
    if (statusArray.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const statusArray = ['WORK', 'HOME', 'LEARNING']
    if (statusArray.includes(category)) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  request.search_q = search_q
  request.todoId = todoId

  if (date !== undefined) {
    try {
      const newdate = new Date(date)
      const formate = format(new Date(date), 'yyyy-MM-dd')

      const checkingdate = toDate(
        new Date(
          `${newdate.getFullYear()}-${
            newdate.getMonth() + 1
          }-${newdate.getDate()}`,
        ),
      )

      const check = new Date(
        `${newdate.getFullYear()}-${
          newdate.getMonth() + 1
        }-${newdate.getDate()}`,
      )
      console.log(check)
      const isvaliddate = await isValid(checkingdate)

      if (isvaliddate === true) {
        request.date = formate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
  next()
}

const checkingmiddlewarebody = async (request, response, next) => {
  const {status, priority, category, todo, id, dueDate} = request.body

  const {todoId} = request.params
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    if (statusArray.includes(status)) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const statusArray = ['HIGH', 'MEDIUM', 'LOW']
    if (statusArray.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const statusArray = ['WORK', 'HOME', 'LEARNING']
    if (statusArray.includes(category)) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const newDate = new Date(dueDate)

      const formate = format(new Date(dueDate), 'yyyy-MM-dd')

      const tochecking = toDate(new Date(formate))

      const checking = isValid(tochecking)

      if (checking === true) {
        request.date = formate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }

  request.todoId = todoId

  request.id = id
  request.todo = todo
  next()
}
const requireOutput = object => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  }
}

app.get('/todos/', checkingmiddlewarequery, async (request, response) => {
  const {status = '', priority = '', category = '', search_q = ''} = request
  const dbquery = `
  SELECT * FROM todo WHERE status LIKE "%${status}%" AND priority LIKE "%${priority}%" AND category LIKE "%${category}%" AND todo LIKE "%${search_q}%"
  `
  console.log(dbquery)
  const dbresponce = await db.all(dbquery)
  response.send(dbresponce.map(object => requireOutput(object)))
})

app.get(
  '/todos/:todoId/',
  checkingmiddlewarequery,
  async (request, response) => {
    const {todoId} = request
    console.log(todoId)
    const dbquery = `SELECT * FROM todo WHERE id = ${todoId}`
    const dbresponce = await db.all(dbquery)
    console.log(dbresponce.id)
    response.send(dbresponce.map(object => requireOutput(object)))
  },
)

app.get('/agenda/', checkingmiddlewarequery, async (request, response) => {
  const {date} = request
  console.log(date)
  const dbquery = `SELECT * FROM todo WHERE due_date = "${date}"`
  const dbresponce = await db.all(dbquery)
  console.log(dbresponce)
  response.send(dbresponce)
})

app.post('/todos/', checkingmiddlewarebody, async (request, response) => {
  const {id, todo, priority, category, status, date} = request

  const dbquery = `
  INSERT INTO todo(id, todo, category, priority, status, due_date ) 
  values(
    ${id},
    "${todo}",
    "${category}",
    "${priority}",
    "${status}",
    "${date}"
  )
  `

  await db.run(dbquery)

  response.send('Todo Successfully Added')
})

app.put(
  '/todos/:todoId/',
  checkingmiddlewarebody,
  async (request, response) => {
    const {todoId} = request
    const {priority, status, category, todo, date} = request

    let dbquery
    let text

    switch (true) {
      case status !== undefined:
        dbquery = `UPDATE todo SET status = "${status}" WHERE id = ${todoId};`
        text = 'Status Updated'
        break
      case priority !== undefined:
        dbquery = `UPDATE todo SET priority = "${priority}" WHERE id = ${todoId};`
        text = 'Priority Updated'
        break
      case category !== undefined:
        dbquery = `UPDATE todo SET category = "${category}" WHERE id = ${todoId};`
        text = 'Category Updated'
        break
      case todo !== undefined:
        dbquery = `UPDATE todo SET todo = "${todo}" WHERE id = ${todoId};`
        text = ' Todo Updated'
        break
      case date !== undefined:
        dbquery = `UPDATE todo SET due_date = "${date}" WHERE id = ${todoId};`
        text = 'Due Date Upadated'
        break
    }
    console.log(dbquery)
    await db.run(dbquery)
    response.send(text)
  },
)

app.delete(
  '/todos/:todoId/',
  checkingmiddlewarebody,
  async (request, response) => {
    const {todoId} = request

    const dbquery = `
  DELETE FROM todo WHERE id = ${todoId};
  `

    await db.run(dbquery)
    response.send('Todo Deleted')
  },
)

module.exports = app
