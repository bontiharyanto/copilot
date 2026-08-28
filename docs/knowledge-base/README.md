# Example Knowledge Base

These SOPs are sample source documents for the Helpdesk AI bot. They are intended to be uploaded
to the configured SharePoint Knowledge Management site before testing.

## Included SOPs

- `SOP-IT-001-VPN-Access.md` — VPN connection troubleshooting.
- `SOP-IT-002-Password-Reset.md` — Corporate password reset procedure.
- `SOP-IT-003-Software-Installation.md` — Approved software installation procedure.

## Using the examples

1. Upload the files to a document library in the SharePoint site.
2. Confirm that the files are searchable by the Graph application.
3. Set `SHAREPOINT_SITE_ID` to that site's ID.
4. Ask the bot a question that is answered by one of the SOPs.
5. Confirm that the response is grounded in the document snippet and includes its URL.

The local Markdown files do not have the final SharePoint URLs. Graph Search supplies the
canonical `webUrl` after the documents are uploaded.
