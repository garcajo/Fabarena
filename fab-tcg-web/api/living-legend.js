/**
 * Vercel Serverless Function to scrape Living Legend data
 */
export default async function handler(req, res) {
    try {
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';
        const response = await fetch(url);
        const html = await response.text();

        const activeHeroes = [];

        // Simple regex-based scraping
        // Matches table rows: <tr>...<td>Rank</td><td>Hero</td>...</tr>
        const rows = html.split('<tr');

        const decodeHtmlEntities = (text) => {
            if (!text) return text;
            return text
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#8211;/g, '-')
                .replace(/&#x27;/g, "'")
                .replace(/&ndash;/g, '-')
                .replace(/&mdash;/g, '-')
                .replace(/\s+/g, ' ')
                .trim();
        };

        for (const row of rows) {
            const cells = row.split(/<td[^>]*>/).slice(1).map(c => c.split('</td>')[0].trim());

            if (cells.length >= 3) {
                let rank = decodeHtmlEntities(cells[0].replace(/<[^>]*>/g, ''));
                let heroName = decodeHtmlEntities(cells[1].replace(/<[^>]*>/g, ''));
                let pointsStr = decodeHtmlEntities(cells[cells.length - 1].replace(/<[^>]*>/g, ''));

                let status = 'Active';
                if (rank === 'LL' || rank === 'Ascended') {
                    status = 'Ascended';
                }

                const points = parseInt(pointsStr, 10);
                const isValidName = heroName && heroName.length > 2 && heroName !== '-' && !heroName.includes('Season');

                if (isValidName && !isNaN(points) && points > 0) {
                    const existing = activeHeroes.find(h => h.name === heroName);
                    if (!existing) {
                        activeHeroes.push({
                            name: heroName,
                            points: points,
                            rank: rank,
                            status: status,
                            class: 'Unknown'
                        });
                    }
                }
            }
        }

        const allHeroes = activeHeroes.sort((a, b) => b.points - a.points);

        res.status(200).json(allHeroes);
    } catch (error) {
        console.error('Error scraping LL:', error);
        res.status(500).json({ error: 'Failed to fetch Living Legend data' });
    }
}
