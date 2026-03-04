import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createJob, getJobById, updateJob } from "../utils/jobStore";

function PostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Lawn Care",
    budget: "",
    postedBy: "Demo User",
    postedByRating: 4.8,
    urgency: null,
    status: "open",
    location: "Syracuse, NY"
  });

  useEffect(() => {
    if (!editId) {
      return;
    }

    const job = getJobById(editId);

    if (job) {
      setFormData(job);
    }
  }, [editId]);

  function handleChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (editId) {
      updateJob(editId, formData);
    } else {
      createJob(formData);
    }

    navigate("/job-board");
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>{editId ? "Edit Job" : "Post a Job"}</h1>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <input
          placeholder="Budget"
          value={formData.budget}
          onChange={(e) => handleChange("budget", e.target.value)}
        />

        <button type="submit">
          {editId ? "Save Changes" : "Create Job"}
        </button>

      </form>
    </div>
  );
}

export default PostJob;
