import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
// import mysql from 'mysql2';
import pkg from 'pg';
const { Pool } = pkg;

import bcrypt from 'bcrypt';

var app = express();
app.use(express.json());

var connection = new Pool({
  host: "localhost",
  user: "sandyllapa",
  password: "nature134",
  database: "sandyllapa",
  port: 5432
});
// server listens on port 4131 for incoming connections 
const port = 4131
app.listen(port, () => console.log('Listening on port: ' + port + '!'));

console.log("Connected to POSTGRESQL database!");


app.use(session({
  secret: 'csci4131secret',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('views', 'static/views');
app.set('view engine', 'pug');
app.use('/js', express.static('static/js'));
app.use('/css', express.static('static/css'));
app.use('/images', express.static('static/images'));



// Home -> GET
app.get('/home.html', function (req, res) {
  if (req.session && req.session.loggedIn) { // if logged in, redirect to contacts page 
    res.sendFile('/home.html', { root: 'static/html' });
  }
  else {
    res.redirect('/login.html');
  }
});

// show table contents  -> GET
app.get('/ToDoList', function (req, res) {

  if (req.session && req.session.loggedIn) {
    const username = req.session.username;

    connection.query('SELECT * FROM to_do WHERE username=$1', [username], function (err, results) {
      if (err) throw err;

      if (results.rows.length == 0) {
        console.log("No entries in to_do table");
        console.log(results.body);
      }
      else {

        for (var i = 0; i < results.rows.length; i++) {
          console.log(results.rows[i].id + " " + results.rows[i].status + " " + results.rows[i].todo_item + " " + results.rows[i].deadline);
        }
      }
      res.json(results.rows);
      console.log("\n" + JSON.stringify(results.rows));
    });
  }
  else {
    res.redirect('/login.html');
  }
});

// add item -> GET
app.get('/additem.html', function (req, res) {
  if (req.session && req.session.loggedIn) {
    res.sendFile('additem.html', { root: 'static/html' });
  }
  else {
    res.redirect('/login.html');
  }
});

// post added task -> POST
app.post('/add-task', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const postData = req.body;
    const username = req.session.username;
    postData.status = 0; // default status=not done for new task



    connection.query('INSERT INTO to_do (todo_item,deadline,status,username) VALUES($1,$2,$3,$4)', [postData.todo_item, postData.deadline, postData.status, username], function (err, result) {
      if (err) {
        throw err;
      }
      else {
        console.log("Values inserted");
        res.redirect(302, '/home.html');
      }
    });
  }
});

// Create account -> GET
app.get('/createAccount.html', function (req, res) {
  if (req.session && req.session.loggedIn) {
    res.redirect('/home.html'); //if successful redirect to contacts page 
  } else {
    res.sendFile('createAccount.html', { root: 'static/html' }); // if not try again
  }
});

//create account -> POST
app.post('/createAccount', function (req, res) {
  const SALT_ROUNDS_COUNT = 10;
  const username = req.body.username;
  const password = req.body.password;

  // hash password to store in database 
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS_COUNT);
  connection.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword], function (err, results) {

    if (err) {
      console.error('Error creating account: ', err);
      console.log('body =', req.body);
      console.log('username ID =', req.body.id);
      console.log('username username =', req.body.username);
      console.log('username password =', req.body.password);

      if (err.code == '23505') {
        return res.status(409).send('Username already exists');
      }
      return res.status(500).send('Failed to create account');
    }

    // regenerate session
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error in regenerating session');
        return res.status(500).send('Failed to regenerate session');
      }
      req.session.loggedIn = true;
      req.session.username = username;
      res.status(200).send('Successfully created account');
    });
  });
});


// Edit task -> GET
app.get('/edit-task/:id', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const itemId = req.params.id;

    connection.query('SELECT * FROM to_do WHERE id = $1', [itemId], function (err, result) {
      if (err) {
        console.error('Error in database: ', err);
        return res.status(500).send('Database error');
      }

      if (result.rows.length > 0) {
        // Format the deadline to 'YYYY-MM-DD'
        const formattedItem = { ...result.rows[0], deadline: result.rows[0].deadline.toISOString().split('T')[0] };

        res.render('edit-task', { item: formattedItem });
      } else {
        res.status(404).send('Item not found');
      }
    });
  } else {
    res.redirect('/login.html');
  }
});

// post route: /edit-task/:id
app.post('/edit-task/:id', function (req, res) {

  if (req.session && req.session.loggedIn) {
    const itemId = req.params.id;
    const todo_item = req.body.todo_item;
    const deadline = req.body.deadline;
    const status = 0;


    const update = { todo_item, deadline, status };

    // update the item 
    connection.query('UPDATE to_do SET todo_item = $1, deadline = $2, status = $3 WHERE id = $4',
      [update.todo_item, update.deadline, update.status, itemId], function (err, result) {
        if (err) {
          console.error('Error in database: ', err);
          return res.status(500).send('Failed to update item');
        }
        res.redirect('/home.html');
      });
  }
  else {
    res.redirect('/login.html');
  }

});

// update checkbox -> PUT
app.put('/updateStatus/:id', (req, res) => {
  if (req.session && req.session.loggedIn) {
    const taskId = req.params.id; // Task ID
    const newStatus = req.body.status; // status
    const username = req.session.username; // Logged-in user

    console.log(`Updating task ${taskId} to status ${newStatus} for user ${username}`);

    connection.query(
      'UPDATE to_do SET status = $1 WHERE id = $2 AND username=$3', [newStatus, taskId, username], (err, result) => {
        if (err) {
          console.error('Error updating task status:', err);
          return res.status(500).send('Failed to update task status');
        }

        if (result.rowCount === 0) {
          console.error(`Task ${taskId} not found for user ${username}`);
          return res.status(404).send('Task not found');
        }

        console.log(`Task ${taskId} updated successfully to status ${newStatus}`);
        res.status(200).send('Task status updated');
      }
    );
  } else {
    res.status(403).send('Not authorized');
  }
});



// Get route: Log out 
app.get('/logout', function (req, res) {

  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error("Error in destroying session: ", err);
        return res.status(500).send('Error logging out');
      }

      // Redirect to login page
      console.log("Session Destroyed");
      res.redirect('/login.html');
    });
  }
  else {
    console.log("Not logged in, cannot destroy session");
    res.redirect('/login.html');
  }
});

//get login.html route
app.get('/login.html', function (req, res) {
  if (req.session && req.session.loggedIn) {
    res.redirect('/home.html');
  }
  else {
    res.sendFile('login.html', { root: 'static/html' });
  }
});


//post login route
app.post('/login', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  connection.query('SELECT password FROM users WHERE username = $1', [username], function (err, results) {
    if (err) {
      console.error("Error in database: ", err);
      return res.status(500).send('Error');
    }

    if (results.rows.length == 0) {
      return res.status(401).send('Invalid username');
    }

    // check if password matches 
    const passwordDB = results.rows[0].password;
    const passwordMatch = bcrypt.compareSync(password, passwordDB);

    if (!passwordMatch) {
      console.log("PASSWORD DOES NOT MATCH");
      return res.status(401).send('Invalid password');
    }

    // regenerate session
    req.session.regenerate((err) => {
      if (err) {
        return res.status(401).send('Failed to regenerate session');
      }

      req.session.loggedIn = true;
      req.session.username = username;
      res.status(200).send('Login was successful');
    });
  }
  );
});

// delete route
app.delete('/delete/:id', function (req, res) {

  if (req.session && req.session.loggedIn) {
    const itemId = req.params.id;
    const username = req.session.username;
    connection.query('DELETE FROM to_do where id = $1 AND username=$2', [itemId, username], function (err, result) {
      if (err) {
        throw err;
      }

      console.log(`Item deleted: ${itemId}`);
      res.status(200).send('Item deleted');
    });
  }
  else {
    res.redirect('/login.html')
  }
});

//sort by deadline - get route
app.get('/sort-deadline', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const username = req.session.username;
    connection.query('SELECT * FROM to_do WHERE username=$1 ORDER BY deadline ASC', [username], (err, results) => {
      if (err) {
        console.error('Error in sorting: ', err);
        return res.status(500).send('Error in sorting');
      }
      res.json(results);
    });
  }
  else {
    res.redirect("/login.html");
  }
});

//sort by overdue tasks that are not done - get route
app.get('/overdue-tasks', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const username = req.session.username;
    const query = 'SELECT * FROM to_do WHERE deadline < CURRENT_DATE AND status = 0 AND username= $1 ORDER BY deadline ASC';

    connection.query(query, [username], function (err, result) {
      if (err) {
        console.error('Error fetching overdue tasks:', err);
        return res.status(500).send('Error fetching overdue tasks');
      }
      res.json(result.rows); // Send filtered tasks
    });
  } else {
    res.redirect('/login.html');
  }
});

//sort by done tasks - get route
app.get('/done-tasks', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const username = req.session.username;
    connection.query('SELECT * FROM to_do WHERE status = 1 AND username = $1', [username], function (err, result) {
      if (err) {
        console.error('Error fetching done tasks:', err);
        return res.status(500).send('Error fetching done tasks');
      }
      res.json(result.rows); // Send filtered tasks
    });
  } else {
    res.redirect('/login.html');
  }
});

//sort by not done - get route
app.get('/notdone-tasks', function (req, res) {
  if (req.session && req.session.loggedIn) {
    const username = req.session.username;
    const query = 'SELECT * FROM to_do WHERE status = 0 AND username = $1';

    connection.query(query, [username], function (err, result) {
      if (err) {
        console.error('Error fetching not done tasks:', err);
        return res.status(500).send('Error fetching not done tasks');
      }
      res.json(result.rows); // Send filtered tasks
    });
  } else {
    res.redirect('/login.html');
  }
});