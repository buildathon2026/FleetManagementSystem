from __future__ import annotations

import argparse
import json

from .storage import ConversationStore


def main() -> None:
    parser = argparse.ArgumentParser(description="Compile thumbs-down feedback into planner prompt guidance.")
    parser.add_argument("--limit", type=int, default=5, help="Maximum negative feedback examples to include.")
    args = parser.parse_args()

    store = ConversationStore()
    examples = store.get_negative_feedback_examples(limit=args.limit)
    result = store.save_prompt_improvement_run(examples)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
