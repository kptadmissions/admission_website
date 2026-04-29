import React, { useState, useEffect } from "react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Access Denied
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        You don’t have permission to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go Back
      </button>
    </div>
  );
}