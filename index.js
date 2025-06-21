import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Database connection bilan error handling
async function connectDB() {
  try {
    await db.connect();
    console.log('PostgreSQL database connected successfully!');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

connectDB();

async function itemsArr() {
  try {
    const result = await db.query(`SELECT * FROM items ORDER BY id ASC`);
    return result.rows;
  } catch (err) {
    console.error('Error fetching items:', err);
    return [];
  }
}

app.get("/", async (req, res) => {
  try {
    const items = await itemsArr();
    console.log(items);

    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  } catch (err) {
    console.error('Error rendering page:', err);
    res.status(500).send('Server error');
  }
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;

  if (!item || item.trim() === '') {
    return res.redirect("/");
  }

  try {
    // SQL injection'dan himoya qilish uchun parameterized query
    await db.query('INSERT INTO items (title) VALUES ($1)', [item.trim()]);
    res.redirect("/");
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).send('Error adding item');
  }
});

app.post("/edit", async (req, res) => {
  console.log(req.body);
  const itemID = req.body.updatedItemId;
  const itemTitle = req.body.updatedItemTitle;

  if (!itemTitle || itemTitle.trim() === '') {
    return res.redirect("/");
  }

  try {
    // SQL injection'dan himoya qilish uchun parameterized query
    await db.query('UPDATE items SET title = $1 WHERE id = $2', [itemTitle.trim(), itemID]);
    res.redirect('/');
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).send('Error updating item');
  }
});

app.post("/delete", async (req, res) => {
  console.log(req.body);
  const deletedID = req.body.deleteItemId;

  try {
    // SQL injection'dan himoya qilish uchun parameterized query
    await db.query('DELETE FROM items WHERE id = $1', [deletedID]);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).send('Error deleting item');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.end();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});