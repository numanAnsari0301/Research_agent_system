# Research Desk UI

Drop these into your `multi_agent_system` folder:

```
multi_agent_system/
├── agent.py
├── pipeline.py
├── tools.py
├── server.py        <- new (FastAPI, streams progress to the UI)
└── frontend/        <- new (React + Vite)
```

## Run it (two terminals)

Backend, from `multi_agent_system` with your venv active:

    pip install fastapi uvicorn
    uvicorn server:app --reload --port 8000

Frontend:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173

## No backend yet?

Switch on "Demo data" in the header. Include the word "fail" in a topic
to preview the error state.
