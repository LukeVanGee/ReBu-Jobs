// ============================================================
// jobStore Utility
// Handles frontend-only CRUD using localStorage
// ============================================================

const STORAGE_KEY = "rebu.jobs.v1";

function loadJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load jobs:", error);
    return [];
  }
}

function saveJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function seedJobsIfEmpty() {
  const jobs = loadJobs();

  if (jobs.length > 0) {
    return;
  }

  const seeded = [
    {
      id: crypto.randomUUID(),
      title: "Shovel driveway",
      description: "Need help shoveling before 6pm.",
      category: "Snow Removal",
      budget: "$30",
      postedBy: "Demo User",
      postedByRating: 4.8,
      time: "Just now",
      urgency: "ASAP",
      status: "open",
      location: "Syracuse, NY"
    }
  ];

  saveJobs(seeded);
}

export function getJobs() {
  return loadJobs();
}

export function getJobById(id) {
  const jobs = loadJobs();
  return jobs.find((job) => job.id === id) || null;
}

export function createJob(jobData) {
  const jobs = loadJobs();

  const newJob = {
    id: crypto.randomUUID(),
    ...jobData,
    time: "Just now"
  };

  const updatedJobs = [newJob, ...jobs];

  saveJobs(updatedJobs);

  return newJob;
}

export function updateJob(id, updatedFields) {
  const jobs = loadJobs();

  const updatedJobs = jobs.map((job) => {
    if (job.id === id) {
      return { ...job, ...updatedFields };
    }

    return job;
  });

  saveJobs(updatedJobs);
}

export function deleteJob(id) {
  const jobs = loadJobs();

  const filteredJobs = jobs.filter((job) => job.id !== id);

  saveJobs(filteredJobs);
}
