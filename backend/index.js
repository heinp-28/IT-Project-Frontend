import express from "express";
import mysql from "mysql";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to database:", err);
        
      } else {
        console.log("Connected to database");
      }
});

// Middleware
app.use(express.json());
app.use(cors())

app.get("/", (req,res)=>{
    res.json("hello this is the backend");
})

app.get('/entries', (req,res)=>{
    const q = "SELECT * FROM entriesfull";
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    });
});

app.post("/", (req,res)=>{
    const q = "INSERT INTO entries (`Given Names`, `Family Name`, Birth, Death, `Short Description`, Link, Status) VALUES (?)";
    const values = [req.body["Given Names"], req.body["Family Name"], req.body.Birth, req.body.Death, req.body["Short Description"], req.body.Link, req.body.Status];

    db.query(q, [values], (err,data)=> {
        if(err) return res.json(err)
        return res.json("Entry has been addedd successfully")
    });
});

app.put("/assign", (req, res) => {
    const { assignedId, assignedTo, selectedEntryIds } = req.body;

    if (!assignedId || !assignedTo || selectedEntryIds.length === 0) {
        return res.status(400).json("Invalid request data");
    }

    const q = "UPDATE entriesfull SET `Assigned To` = ?, `Assigned Id` = ? WHERE id IN (?)";
    const values = [assignedTo, assignedId, selectedEntryIds];

    db.query(q, values, (err, data) => {
        if (err) return res.json(err);
        return res.json("Entries have been assigned successfully");
    });
});

app.put("/unassign", (req, res) => {
    const { selectedEntryIds } = req.body;
    
    if (!selectedEntryIds || selectedEntryIds.length === 0) {
        return res.status(400).json("No entries selected");
    }

    const q = "UPDATE entriesfull SET `Assigned To` = NULL, `Assigned Id` = NULL WHERE id IN (?)";
    
    db.query(q, [selectedEntryIds], (err, data) => {
        if (err) {
            console.error("Error unassigning entries:", err);
            return res.json(err);
        }
        return res.json("Entries have been unassigned successfully");
    });
});

app.put("/update-status/:id", (req, res) => {
    const entryId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json("Status is required");
    }

    const q = "UPDATE entriesfull SET Status = ? WHERE id = ?";
    const values = [status, entryId];

    db.query(q, values, (err, data) => {
        if (err) return res.json(err);
        return res.json("Status updated successfully");
    });
});

// API endpoint for getting all comments
app.get("/comments", (req, res) => {
    const q = "SELECT * FROM comments";
    db.query(q, (err, data) => {
      if (err) {
        console.error("Error fetching comments:", err);
        return res.json(err);
      }
      return res.json(data);
    });
  });
  
// API endpoint for adding a new comment
app.post("/comments", (req, res) => {
    const { Entry_id, Comment, Commenter, CommenterId, Date_Time } = req.body;
  
    if (!Entry_id || !Comment || !Commenter || !CommenterId) {
      return res.status(400).json("All fields are required");
    }
  
    const q = "INSERT INTO comments (Entry_id, Comment, CommenterId, Commenter, Date_Time) VALUES (?, ?, ?, ?, ?)";
    const values = [Entry_id, Comment, CommenterId, Commenter, Date_Time];
  
    db.query(q, values, (err, data) => {
      if (err) {
        console.error("Error adding comment:", err);
        return res.json(err);
      }
      return res.json("Comment added successfully");
    });
  });
  

const PORT = process.env.PORT || 8800;
app.listen(PORT, ()=>{
    console.log("Connected to backend!")
})