import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";

export default function ExamQuestions() {
  const { getToken } = useAuth();

  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);

  /* =========================
  LOAD QUESTIONS
  ========================= */
  const loadQuestions = async () => {
    try {
      const token = await getToken();

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/exam/questions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuestions(res.data);

    } catch {
      toast.error("Failed to load questions");
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  /* =========================
  UPLOAD
  ========================= */
  const upload = async () => {
    if (!file) return toast.error("Select file");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/exam/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Uploaded!");
      loadQuestions();

    } catch {
      toast.error("Upload failed");
    }
  };

  /* =========================
  UPDATE
  ========================= */
  const update = async (q) => {
    try {
      const token = await getToken();

      await axios.put(
        `${import.meta.env.VITE_API_URL}/exam/questions/${q._id}`,
        q,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Updated");

    } catch {
      toast.error("Update failed");
    }
  };

  /* =========================
  DELETE
  ========================= */
  const remove = async (id) => {
    try {
      const token = await getToken();

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/exam/questions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Deleted");
      loadQuestions();

    } catch {
      toast.error("Delete failed");
    }
  };

  /* =========================
  UI
  ========================= */

  return (
    <div className="max-w-6xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-6">
        Question Bank
      </h1>

      {/* UPLOAD */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={upload}
          className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">

        {questions.map((q, i) => (
          <div key={q._id} className="border p-4 mb-4 rounded">

            <input
              value={q.question}
              onChange={(e) => {
                const newQ = [...questions];
                newQ[i].question = e.target.value;
                setQuestions(newQ);
              }}
              className="w-full border p-2 mb-2"
            />

            {q.options.map((opt, idx) => (
              <input
                key={idx}
                value={opt}
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[i].options[idx] = e.target.value;
                  setQuestions(newQ);
                }}
                className="w-full border p-2 mb-1"
              />
            ))}

            <input
              value={q.correctAnswer}
              onChange={(e) => {
                const newQ = [...questions];
                newQ[i].correctAnswer = e.target.value;
                setQuestions(newQ);
              }}
              placeholder="Correct Option (A/B/C/D)"
              className="border p-2 mb-2"
            />

            <div className="flex gap-3">
              <button
                onClick={() => update(q)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>

              <button
                onClick={() => remove(q._id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}