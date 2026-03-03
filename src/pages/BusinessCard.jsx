import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from "@mui/material";

function BusinessCardForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState(
    initialData || {
      full_name: "",
      title: "",
      email: "",
      phone: "",
      whatsapp: "",
      region: "",
      profile_photo_url: "",
      business_card_front_url: "",
      business_card_back_url: ""
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, upload the file to storage (Firebase, Supabase, S3, etc.)
      // For now, we’ll just create a temporary URL
      const fileUrl = URL.createObjectURL(file);
      setFormData({ ...formData, [fieldName]: fileUrl });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="WhatsApp"
          name="whatsapp"
          value={formData.whatsapp}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Region"
          name="region"
          value={formData.region}
          onChange={handleChange}
        />
      </Grid>

      {/* Upload Buttons */}
      <Grid item xs={12} sm={4}>
        <Button variant="outlined" component="label" fullWidth>
          Upload Profile Photo
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "profile_photo_url")}
          />
        </Button>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Button variant="outlined" component="label" fullWidth>
          Upload Front Card
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "business_card_front_url")}
          />
        </Button>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Button variant="outlined" component="label" fullWidth>
          Upload Back Card
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "business_card_back_url")}
          />
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSubmit(formData)}
        >
          Save Business Card
        </Button>
      </Grid>
    </Grid>
  );
}

export default function BusinessCardManager() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (data) => {
    console.log("Business Card Submitted:", data);
    // TODO: Replace with API call to backend (create/update business card)
    setOpen(false);
  };

  return (
    <div>
      {/* Create Button */}
      <Button variant="contained" color="secondary" onClick={() => setOpen(true)}>
        Create Business Card
      </Button>

      {/* Dialog Form */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create / Edit Business Card</DialogTitle>
        <DialogContent>
          <BusinessCardForm onSubmit={handleSubmit} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}