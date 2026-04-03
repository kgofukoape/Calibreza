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
```

**Then:**
1. Name it `page.tsx` (add `.tsx` to the filename)
2. Click **"Commit changes..."** (green button)
3. Confirm the commit

---

## **Step 2: Delete the OLD wrong file**

After you commit, navigate to:
```
src/app/dashboard/listings/[id]/page.tsx
