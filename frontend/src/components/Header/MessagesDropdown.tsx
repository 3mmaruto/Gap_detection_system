import IconDropdown from "./IconDropdown";
import { useMessages } from "@/hooks/useMessages";

export default function MessagesDropdown() {
    const { conversations, count } = useMessages();

    return (
        <IconDropdown
            icon="bi-chat"
            badge={count}
            header="Messages"
            footerLabel="Show All Messages"
            fullWidth
        >
            {conversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                    <a className="dropdown-item" href="#">
                        Conversation #{c.id}
                    </a>
                </li>
            ))}
        </IconDropdown>
    );
}
