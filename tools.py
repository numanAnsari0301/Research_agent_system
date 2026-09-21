from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print


tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))



@tool
def web_search(query : str)-> str:
    """Search the web for recent and reliable information on a topic. Returns Titles, URLs and snippets """
    
    results = tavily.search(query=query, max_results=5)
    out = []
    for r in results['results']:
        out.append(
            f"Title : {r['title']}\nURL:{r['url']}\nsnippet: {r['content'][:300]}\n"
        )
    return "\n-------------------------\n".join(out)



# print(web_search.invoke("give the curent war news"))


@tool
def web_scrap(url: str) -> str:
    """
    Scrape the content of a webpage from the given URL.
    Returns the main textual content of the webpage.
    """

    try:
        # Send request to webpage
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )

        # Raise error if request failed
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove unnecessary elements
        for element in soup(["script","style","nav","footer"]):
            element.decompose()

        # Extract text


        return soup.get_text(separator=" ", strip=True)[:3000]

    except requests.exceptions.RequestException as e:
        return f"Error while accessing webpage: {str(e)}"

    except Exception as e:
        return f"Error while scraping webpage: {str(e)}"



