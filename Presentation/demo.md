
## 1. Rich Content Demo (Mixed Media)
> [!multi-column|bordered]
>
>> [!col|45]
>> ## Rich Markdown
>>> [!multi-column|bordered]
>>>
>>>> [!col|50]
>>>> - **Bold**, *italic*, and `inline code`.
>>>> - Task list:
>>>>   - [ ] Write spec
>>>>   - [x] Style columns
>>>> - Link: [Obsidian](https://obsidian.md)
>>>
>>>> [!col|50]
>>>>  - Table:
>>>> 
>>>> | Feature | Status |
>>>> | --- | --- |
>>>> | Tables | ✅ |
>>>> | Images | ✅ |
>> - Mermaid Diagram:
>> ```mermaid
>> graph LR
>> A[Start] --> B(Process)
>> B --> C{Decision}
>> C -->|Yes| D[Result]
>> ```
>> - LaTeX Equation:
>> $$ e^{i\pi} + 1 = 0 $$
>> $$
>> \text{Start} \to \text{Decision} 
>> \begin{cases} 
>>     \text{Yes} \to \text{Success} \\ 
>>     \text{No} \to \text{Fail} 
>> \end{cases}
>> $$
>
>> [!col|55]
>> ## Media & Nested Blocks
>> ![[image.png|image.png|750]]
>>
>> ```js
>> // Code block inside column
>> const cols = [33, 34, 33];
>> console.log('Supports code blocks', cols);
>> ```
>>
>>> [!multi-column|bordered]
>>>
>>>> [!col|50]
>>>> ## Project A
>>>> - Overview: basic multi-column layout.
>>>> - Highlight: pure Markdown, readable in plaintext.
>>>
>>>> [!col|50]
>>>> ## Project B
>>>> - Overview: two-column template with ratios.
>>>> - Highlight: one-click insert via context menu.
>>
>> >[!note]
>> > Blockquote to show nested text.
>> > Can span multiple lines without breaking layout.

---
## 2. Siderbar Left (30/70)
> [!multi-column|bordered]
>
>> [!col|30]
>> ## Mode 1: Sidebar Left
>> - 30/70 left sidebar layout.
>> - Good for TOC, navigation, summaries.
>
>> [!col|70]
>> ## Mode 2: Main Content
>> - Large content area for prose/charts. Large content area for prose/charts.
>> - Pair with the sidebar for focus. Pair with the sidebar for focus. Pair with the sidebar for focus.

---
## 3. Three Columns (33/34/33)
> [!multi-column|bordered]
>
>> [!col|33]
>> ## Project A
>> - Overview: basic multi-column layout.
>> - Highlight: pure Markdown, readable in plaintext.
>
>> [!col|34]
>> ## Project B
>> - Overview: two-column template with ratios.
>> - Highlight: one-click insert via context menu.
>
>> [!col|33]
>> ## Project C
>> - Overview: mobile auto-stack demo.
>> - Highlight: CSS snippet works standalone.


