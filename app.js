
const express = require("express");
const db = require("./database/database");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to LensLab Studio API",
        status: "Server is running"
    });
});

app.get("/photographers", (req, res) => {
    try {
        const photographers = db.prepare(
            "SELECT * FROM photographers ORDER BY photographer_id"
        ).all();

        res.status(200).json(photographers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/photographers/:id", (req, res) => {
    try {
        const photographer = db.prepare(
            "SELECT * FROM photographers WHERE photographer_id = ?"
        ).get(req.params.id);

        if (!photographer) {
            return res.status(404).json({
                message: "Photographer not found"
            });
        }

        res.status(200).json(photographer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/photographers", (req, res) => {
    try {
        const { name, phone, email } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            typeof email !== "string" || !email.trim()
        ) {
            return res.status(400).json({
                message: "Name, phone and email are required"
            });
        }

        const result = db.prepare(
            "INSERT INTO photographers (name, phone, email) VALUES (?, ?, ?)"
        ).run(name.trim(), phone.trim(), email.trim());

        res.status(201).json({
            message: "Photographer added successfully",
            photographer_id: result.lastInsertRowid
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(400).json({
                message: "Phone or email already exists"
            });
        }

        res.status(500).json({ message: error.message });
    }
});

app.put("/photographers/:id", (req, res) => {
    try {
        const { name, phone, email } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            typeof email !== "string" || !email.trim()
        ) {
            return res.status(400).json({
                message: "Name, phone and email are required"
            });
        }

        const result = db.prepare(`
      UPDATE photographers
      SET name = ?, phone = ?, email = ?
      WHERE photographer_id = ?
    `).run(name.trim(), phone.trim(), email.trim(), req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Photographer not found"
            });
        }

        res.status(200).json({
            message: "Photographer updated successfully"
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(400).json({
                message: "Phone or email already exists"
            });
        }

        res.status(500).json({ message: error.message });
    }
});

app.delete("/photographers/:id", (req, res) => {
    try {
        const result = db.prepare(
            "DELETE FROM photographers WHERE photographer_id = ?"
        ).run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Photographer not found"
            });
        }

        res.status(200).json({
            message: "Photographer deleted successfully"
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
            return res.status(409).json({
                message: "Cannot delete photographer because rental records exist"
            });
        }

        res.status(500).json({ message: error.message });
    }
});

app.get("/cameras/top", (req, res) => {
    try {
        const cameras = db.prepare(`
      SELECT
        c.camera_id,
        c.name,
        c.kind,
        c.status,
        COUNT(r.rental_id) AS rental_count
      FROM cameras c
      LEFT JOIN rentals r ON c.camera_id = r.camera_id
      GROUP BY c.camera_id
      ORDER BY rental_count DESC, c.camera_id ASC
      LIMIT 5
    `).all();

        res.status(200).json(cameras);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/cameras", (req, res) => {
    try {
        const { kind } = req.query;

        let cameras;

        if (kind && typeof kind === "string") {
            cameras = db.prepare(`
        SELECT * FROM cameras
        WHERE LOWER(kind) LIKE LOWER(?)
        ORDER BY camera_id
      `).all(`%${kind.trim()}%`);
        } else {
            cameras = db.prepare(
                "SELECT * FROM cameras ORDER BY camera_id"
            ).all();
        }

        res.status(200).json(cameras);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/cameras/:id", (req, res) => {
    try {
        const camera = db.prepare(
            "SELECT * FROM cameras WHERE camera_id = ?"
        ).get(req.params.id);

        if (!camera) {
            return res.status(404).json({
                message: "Camera not found"
            });
        }

        res.status(200).json(camera);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/cameras", (req, res) => {
    try {
        const { name, kind, status } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof kind !== "string" || !kind.trim()
        ) {
            return res.status(400).json({
                message: "Camera name and kind are required"
            });
        }

        const cameraStatus = status || "Available";

        if (!["Available", "Rented", "Maintenance"].includes(cameraStatus)) {
            return res.status(400).json({
                message: "Invalid camera status"
            });
        }

        const result = db.prepare(
            "INSERT INTO cameras (name, kind, status) VALUES (?, ?, ?)"
        ).run(name.trim(), kind.trim(), cameraStatus);

        res.status(201).json({
            message: "Camera added successfully",
            camera_id: result.lastInsertRowid
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put("/cameras/:id", (req, res) => {
    try {
        const { name, kind, status } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof kind !== "string" || !kind.trim() ||
            typeof status !== "string" ||
            !["Available", "Rented", "Maintenance"].includes(status)
        ) {
            return res.status(400).json({
                message: "Valid name, kind and status are required"
            });
        }

        const result = db.prepare(`
      UPDATE cameras
      SET name = ?, kind = ?, status = ?
      WHERE camera_id = ?
    `).run(name.trim(), kind.trim(), status, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Camera not found"
            });
        }

        res.status(200).json({
            message: "Camera updated successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete("/cameras/:id", (req, res) => {
    try {
        const result = db.prepare(
            "DELETE FROM cameras WHERE camera_id = ?"
        ).run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Camera not found"
            });
        }

        res.status(200).json({
            message: "Camera deleted successfully"
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
            return res.status(409).json({
                message: "Cannot delete camera because rental records exist"
            });
        }

        res.status(500).json({ message: error.message });
    }
});

const PORT = 3000;

// POST - Add a new rental
app.post("/rentals", (req, res) => {
    try {
        const { photographer_id, camera_id, rental_date, return_date } = req.body;

        if (!photographer_id || !camera_id || !rental_date) {
            return res.status(400).json({
                message: "Photographer ID, Camera ID and Rental Date are required"
            });
        }

        const result = db.prepare(`
            INSERT INTO rentals
            (photographer_id, camera_id, rental_date, return_date)
            VALUES (?, ?, ?, ?)
        `).run(
            photographer_id,
            camera_id,
            rental_date,
            return_date || null
        );

        res.status(201).json({
            message: "Rental created successfully",
            rental_id: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Retrieve all rentals using SQL JOIN

app.post("/rentals", (req, res) => {
    try {
        const {
            photographer_id,
            camera_id,
            rental_date,
            return_date
        } = req.body;

        if (!photographer_id || !camera_id || !rental_date) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const result = db.prepare(`
            INSERT INTO rentals
            (photographer_id, camera_id, rental_date, return_date)
            VALUES (?, ?, ?, ?)
        `).run(
            photographer_id,
            camera_id,
            rental_date,
            return_date || null
        );

        res.status(201).json({
            message: "Rental created successfully",
            rental_id: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`LensLab Studio API running at http://localhost:${PORT}`);
});
