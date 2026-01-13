import { For, Suspense, createResource } from "solid-js"
import { A } from "@solidjs/router"
import Api from "~/core/api"
import { LoadingSpin } from "~/components/loading"
import { useSession } from "~/contexts/SessionProvider"

const RecentNotes = () => {
  const { userInfo } = useSession()
  const [recentNotes] = createResource(userInfo, async (_) => {
    try {
      return await Api.getNotesRecents()
    } catch (err) {
      return []
    }
  })

  return (
    <Suspense fallback={<LoadingSpin />}>
      <ul class="flex gap-2 flex-col items-center mt-2">
        <For each={recentNotes()}>
          {row => <li class="w-full"><A class="btn btn-wide" href={`/${row.slug}`}>{row.value.name}</A></li>}
        </For>
      </ul>
    </Suspense>
  );
}

export default RecentNotes
