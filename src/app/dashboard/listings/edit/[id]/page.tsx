'use client';

export default function EditListingPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-white p-8">
      <h1 className="text-4xl mb-4">EDIT PAGE WORKS!</h1>
      <p className="text-2xl">Listing ID: {params.id}</p>
      <a href="/dashboard" className="text-blue-500 underline text-xl">Back to Dashboard</a>
    </div>
  );
}
