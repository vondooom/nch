import { getStore } from "@/lib/store";

export const metadata = { title: "Subscribers" };

export default function AdminSubscribersPage() {
  const rows = getStore().subscribers ?? [];
  return (
    <div>
      <h1 className="mb-2 font-heading text-[36px] font-bold uppercase">Subscribers</h1>
      <p className="mb-6 font-serif text-[#5C543F]">
        Addresses from Subscribe free. {rows.length} on the list. Connect Beehiiv later and export from here.
      </p>
      {rows.length === 0 ? (
        <p className="font-serif text-[#5C543F]">No signups yet.</p>
      ) : (
        <div className="overflow-x-auto border-2 border-[#211D14]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FBF8F0] font-heading text-[12px] uppercase tracking-[0.12em]">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Added</th>
                <th className="px-4 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#D8CDB4] bg-[#FFFDF7]">
                  <td className="px-4 py-3 font-medium">{row.email}</td>
                  <td className="px-4 py-3 text-[#8A8163]">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#8A8163]">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
