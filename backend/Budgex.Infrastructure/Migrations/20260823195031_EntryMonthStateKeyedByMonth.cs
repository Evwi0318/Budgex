using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Budgex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EntryMonthStateKeyedByMonth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntryMonthStates_BudgetMonths_BudgetMonthId",
                table: "EntryMonthStates");

            migrationBuilder.DropIndex(
                name: "IX_EntryMonthStates_BudgetMonthId_EntryId",
                table: "EntryMonthStates");

            migrationBuilder.DropIndex(
                name: "IX_EntryMonthStates_EntryId",
                table: "EntryMonthStates");

            migrationBuilder.DropColumn(
                name: "BudgetMonthId",
                table: "EntryMonthStates");

            migrationBuilder.AddColumn<string>(
                name: "Month",
                table: "EntryMonthStates",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_EntryMonthStates_EntryId_Month",
                table: "EntryMonthStates",
                columns: new[] { "EntryId", "Month" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EntryMonthStates_EntryId_Month",
                table: "EntryMonthStates");

            migrationBuilder.DropColumn(
                name: "Month",
                table: "EntryMonthStates");

            migrationBuilder.AddColumn<Guid>(
                name: "BudgetMonthId",
                table: "EntryMonthStates",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_EntryMonthStates_BudgetMonthId_EntryId",
                table: "EntryMonthStates",
                columns: new[] { "BudgetMonthId", "EntryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EntryMonthStates_EntryId",
                table: "EntryMonthStates",
                column: "EntryId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntryMonthStates_BudgetMonths_BudgetMonthId",
                table: "EntryMonthStates",
                column: "BudgetMonthId",
                principalTable: "BudgetMonths",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
