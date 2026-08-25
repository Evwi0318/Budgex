using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Budgex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MergeRestaurantAndFitnessCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "Entries" SET "Category" = 'Food' WHERE "Category" = 'Restaurant';
                UPDATE "Entries" SET "Category" = 'Subscription' WHERE "Category" = 'Fitness';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Går inte att vända: efter sammanslagningen finns inget som
            // skiljer en tidigare Restaurant-rad från en vanlig Food-rad.
        }
    }
}
