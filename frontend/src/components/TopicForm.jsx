import { Search } from "lucide-react";

export default function TopicForm({ value, onChange, onSubmit, inputRef }) {
  const ready = value.trim().length >= 2;

  return (
    <form
      className="ask"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit(value);
      }}
    >
      <Search className="ask-icon" size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="topic">
        Research topic
      </label>
      <input
        id="topic"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What should the agents research?"
        autoComplete="off"
        maxLength={300}
        autoFocus
      />
      <button className="btn-primary" type="submit" disabled={!ready}>
        Run research
      </button>
    </form>
  );
}
