from __future__ import annotations

import json
from io import StringIO
from typing import Any

import pytest
from django.core.management import call_command


@pytest.fixture
def schema() -> dict[str, Any]:
    out = StringIO()
    call_command(
        "spectacular",
        "--format",
        "openapi-json",
        "--validate",
        "--fail-on-warn",
        stdout=out,
    )
    parsed: dict[str, Any] = json.loads(out.getvalue())
    return parsed


def test_schema_generates_and_validates(schema: dict[str, Any]) -> None:
    assert schema["openapi"].startswith("3.")
    assert schema["paths"]


def test_schema_has_no_untyped_success_responses(schema: dict[str, Any]) -> None:
    untyped: list[str] = []
    for route, operations in schema["paths"].items():
        for method, operation in operations.items():
            for code, response in operation.get("responses", {}).items():
                if code.startswith(("4", "5")) or "content" not in response:
                    continue
                for media in response["content"].values():
                    if not media.get("schema"):
                        untyped.append(f"{method.upper()} {route} -> {code}")
    assert untyped == []


def test_schema_exposes_no_put_operations(schema: dict[str, Any]) -> None:
    assert [route for route, operations in schema["paths"].items() if "put" in operations] == []


def resolve(schema: dict[str, Any], node: dict[str, Any]) -> dict[str, Any]:
    combined = node.get("allOf")
    if combined:
        return resolve(schema, combined[0])
    ref = node.get("$ref")
    if ref is None:
        return node
    target: dict[str, Any] = schema["components"]["schemas"][ref.rsplit("/", 1)[-1]]
    return resolve(schema, target)


@pytest.mark.django_db
def test_declared_pagination_matches_runtime_response(
    schema: dict[str, Any], api: Any, category: Any
) -> None:
    response = api.get("/api/v1/apps")
    assert response.status_code == 200

    declared = resolve(
        schema,
        schema["paths"]["/api/v1/apps"]["get"]["responses"]["200"]["content"]["application/json"][
            "schema"
        ],
    )
    declared_meta = resolve(schema, declared["properties"]["meta"])

    assert set(response.json()) == set(declared["properties"])
    assert set(response.json()["meta"]) == set(declared_meta["properties"])


@pytest.mark.django_db
def test_declared_query_parameters_are_accepted(api: Any, category: Any) -> None:
    response = api.get("/api/v1/apps?platform=linux&category_id=1&q=fire&page=1&size=5")
    assert response.status_code == 200
