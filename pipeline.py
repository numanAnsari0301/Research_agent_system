from agent import build_reader_agent, build_search_agent, writer_chain, critic_chain
from rich import print
from rich.markup import escape


def extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "\n".join(parts)
    return str(content)


def run_research_pipeline(topic: str) -> dict:
    state = {}

    # Step 1: search agent
    print("\n" + "=" * 50)
    print("Step 1 - Search agent is working .......")
    print("=" * 50)

    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]
    })

    state["search_results"] = extract_text(search_result["messages"][-1].content)
    print("\nSearch results:\n", escape(state["search_results"]))

    # Step 2: reader agent
    print("\n" + "=" * 50)
    print("Step 2 - Reader agent is working .......")
    print("=" * 50)

    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [(
            "user",
            f"""Based on the following search results about '{topic}',
pick the most relevant URL and scrape it for deeper content.

Search Results:
{state['search_results'][:2000]}"""
        )]
    })
    state["scraped_content"] = extract_text(reader_result["messages"][-1].content)

    # Step 3: writer chain
    print("\n" + "=" * 50)
    print("Step 3 - Writer is drafting the report .......")
    print("=" * 50)

    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"DETAILED SCRAPED RESULTS:\n{state['scraped_content']}\n\n"
    )

    report = writer_chain.invoke({
        "topic": topic,
        "research": research_combined,
    })
    # Handles str, AIMessage, or legacy dict output
    if isinstance(report, dict):
        report = report.get("text", str(report))
    elif hasattr(report, "content"):
        report = extract_text(report.content)
    state["report"] = report

    print("\nFinal Report:\n", escape(state["report"]))

    # Step 4: critic chain
    print("\n" + "=" * 50)
    print("Step 4 - Critic is reviewing the report .......")
    print("=" * 50)

    feedback = critic_chain.invoke({"report": state["report"]})
    if isinstance(feedback, dict):
        feedback = feedback.get("text", str(feedback))
    elif hasattr(feedback, "content"):
        feedback = extract_text(feedback.content)
    state["feedback"] = feedback

    print("\nCritic report:\n", escape(state["feedback"]))

    return state


if __name__ == "__main__":
    topic = input("\nEnter a research topic: ")
    run_research_pipeline(topic)