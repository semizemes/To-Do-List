import express from "express";
import bodyParser from "body-parser";
import pg, {Client} from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'permalist',
  password: 'postgres',
  port: 5432,
});

db.connect();

// let items = [
//   { id: 1, title: "Buy milk" },
//   { id: 2, title: "Finish homework" },
// ];

async function itemsArr () {
  const result = await db.query(`select * from items ORDER BY id ASC`);
  let items = [];
  result.rows.forEach((item) => {
    items.push(item);
  });
  return items;
};

app.get("/", async (req, res) => {
  const items = await itemsArr();
  console.log(items);

  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", (req, res) => {
  const item = req.body.newItem;
  db.query(`insert into items (title) values ('${item}')`)
  res.redirect("/");
});

app.post("/edit", (req, res) => {
  console.log(req.body);
  let itemID = req.body.updatedItemId;
  let itemTitle = req.body.updatedItemTitle;
  db.query(`UPDATE items SET title = '${itemTitle}' WHERE id = ${itemID}`);
  res.redirect('/');
});

app.post("/delete", (req, res) => {
  console.log(req.body);
  let deletedID = req.body.deleteItemId;
  db.query(`delete from items where id=${deletedID}`);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
