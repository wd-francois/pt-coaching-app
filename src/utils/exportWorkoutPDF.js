export function exportWorkoutToPDF({ workout, exercises, clientName, date }) {
    const getExerciseName = (id) =>
        exercises.find((e) => e.id === id)?.name || 'Unknown Exercise';

    const formatDate = (d) => {
        if (!d) return '';
        const parsed = typeof d === 'number' ? new Date(d) : new Date(d + 'T00:00:00');
        return parsed.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    // Group exercises by superset
    const rows = [];
    const seen = new Set();
    (workout.exercises || []).forEach((ex, i) => {
        if (seen.has(i)) return;
        if (ex.supersetGroup) {
            const partners = workout.exercises
                .map((e, idx) => ({ e, idx }))
                .filter(({ e, idx }) => idx !== i && e.supersetGroup === ex.supersetGroup && !seen.has(idx));
            const group = [{ ex, i }, ...partners];
            group.forEach(({ idx }) => seen.add(idx));
            rows.push({ type: 'superset', items: group.map(({ ex: e }) => e) });
        } else {
            seen.add(i);
            rows.push({ type: 'single', ex });
        }
    });

    const exerciseHTML = rows.map((row) => {
        if (row.type === 'superset') {
            return row.items.map((ex, idx) => buildExerciseBlock(ex, getExerciseName, idx === 0 ? 'SUPERSET' : '')).join('');
        }
        return buildExerciseBlock(row.ex, getExerciseName, '');
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${workout.name || 'Workout'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 32px; font-size: 13px; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
  .exercise { margin-bottom: 20px; page-break-inside: avoid; }
  .exercise-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .superset-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; background: #6d28d9; color: #fff; padding: 1px 7px; border-radius: 999px; margin-right: 8px; vertical-align: middle; }
  .notes { font-size: 11px; color: #555; font-style: italic; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #ddd; padding: 4px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .superset-divider { border-top: 1px dashed #a78bfa; margin: 8px 0; }
  footer { margin-top: 40px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
  @media print {
    body { padding: 16px; }
    @page { margin: 16mm; }
  }
</style>
</head>
<body>
<h1>${workout.name || 'Workout'}</h1>
<p class="meta">${[clientName, formatDate(date)].filter(Boolean).join(' · ')}</p>
${exerciseHTML}
<footer>PT Coach &nbsp;·&nbsp; Exported ${new Date().toLocaleDateString()}</footer>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
        alert('Pop-up blocked. Please allow pop-ups for this site to export PDFs.');
        return;
    }
    win.document.write(html);
    win.document.close();
}

function buildExerciseBlock(ex, getExerciseName, badge) {
    const sets = ex.sets || [];
    const rows = sets.map((s, i) =>
        `<tr><td>${i + 1}</td><td>${s.reps ?? ''}</td><td>${s.load ?? ''}</td></tr>`
    ).join('');

    const divider = badge === '' && ex.supersetGroup ? '<div class="superset-divider"></div>' : '';

    return `${divider}<div class="exercise">
  <div class="exercise-name">${badge ? `<span class="superset-badge">${badge}</span>` : ''}${getExerciseName(ex.exerciseId)}</div>
  ${sets.length ? `<table><thead><tr><th>#</th><th>Reps</th><th>Load</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
  ${ex.notes ? `<p class="notes">${ex.notes}</p>` : ''}
</div>`;
}
