from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_scrap, web_search
import os

from dotenv import load_dotenv
load_dotenv()

#model setup
model = ChatGoogleGenerativeAI(model = "gemini-3.6-flash")

# parser setup
parser = StrOutputParser()



#  1st Agent creation
def build_search_agent():
    return create_agent(
        model= model,
        tools=[web_search]
    )
    
    
#  2nd agent- Reader agent
def build_reader_agent():
    return create_agent(
        model = model,
        tools = [web_scrap]
    )


# Writer prompt
writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are an expert research writer.

Your task is to write clear, structured, accurate, and insightful
research reports based on the research provided by the user.

Follow these rules:
- Use only the information provided in the research.
- Do not make up facts or information.
- Organize the information logically.
- Explain important points clearly and in sufficient detail.
- Avoid unnecessary repetition.
- Use professional but easy-to-understand language.
- Include the sources/URLs available in the research.

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)
"""
    ),
    (
        "human",
        """
Write a detailed research report on the topic below.

Topic:
{topic}

Research Gathered:
{research}
"""
    )
])


# writer_ chain
writer_chain = writer_prompt | model | parser

# critic_prompt
critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a sharp and constructive research critic. "
        "Be honest, specific, and objective. "
        "Identify both the strengths and weaknesses of the research report. "
        "Focus on accuracy, relevance, clarity, completeness, and quality of sources."
    ),
    (
        "human",
        """
Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...
- ...

Weaknesses:
- ...
- ...
- ...

Suggestions for Improvement:
- ...
- ...
- ...
"""
    )
])


#critic_chain
critic_chain = critic_prompt | model | parser

